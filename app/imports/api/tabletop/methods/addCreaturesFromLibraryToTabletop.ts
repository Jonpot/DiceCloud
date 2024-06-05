import SimpleSchema from 'simpl-schema';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { RateLimiterMixin } from 'ddp-rate-limiter-mixin';
import { assertUserInTabletop } from './shared/tabletopPermissions';
import { assertUserHasPaidBenefits } from '/imports/api/users/patreon/tiers';
import Creatures from '/imports/api/creature/creatures/Creatures';
import LibraryNodes from '/imports/api/library/LibraryNodes';
import { getFilter, renewDocIds } from '/imports/api/parenting/parentingFunctions';
import { reifyNodeReferences, storeLibraryNodeReferences } from '/imports/api/creature/creatureProperties/methods/insertPropertyFromLibraryNode';
import CreatureProperties from '/imports/api/creature/creatureProperties/CreatureProperties';

const addCreaturesFromLibraryToTabletop = new ValidatedMethod({

  name: 'tabletops.addCreaturesFromLibraryToTabletop',

  validate: new SimpleSchema({
    'libraryNodeIds': {
      type: Array,
    },
    'libraryNodeIds.$': {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
    },
    tabletopId: {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
    },
  }).validator(),

  mixins: [RateLimiterMixin],
  rateLimit: {
    numRequests: 1,
    timeInterval: 5_000,
  },

  run({ libraryNodeIds, tabletopId }) {
    if (!this.userId) {
      throw new Meteor.Error('tabletops.addCreatures.denied',
        'You need to be logged in to remove a tabletop');
    }
    assertUserHasPaidBenefits(this.userId);
    assertUserInTabletop(tabletopId, this.userId);

    for (const nodeId of libraryNodeIds) {
      const creatureNode = LibraryNodes.findOne({
        _id: nodeId,
        type: 'creature',
        removed: { $ne: true },
      });

      if (!creatureNode) {
        if (Meteor.isClient) return {};
        else {
          throw new Meteor.Error(
            'Insert property from library failed',
            `No library creature with id '${nodeId}' was found`
          );
        }
      }

      const creatureId = Creatures.insert({
        ...creatureNode,
        type: 'monster',
        tabletopId,
        owner: this.userId,
        writers: [this.userId],
        dirty: true,
      });
      insertSubProperties(creatureNode, creatureId);
    }
  },
});

function insertSubProperties(node, creatureId: string) {
  let nodes = LibraryNodes.find({
    ...getFilter.descendants(node),
    removed: { $ne: true },
  }).fetch();

  for (const node of nodes) {
    node.root = {
      '_id': creatureId,
      collection: 'creatures',
    };
  }

  // Convert all references into actual nodes
  nodes = reifyNodeReferences(nodes);

  // set libraryNodeIds
  storeLibraryNodeReferences(nodes);

  // Give the docs new IDs without breaking internal references
  renewDocIds({
    docArray: nodes,
    collectionMap: { 'libraryNodes': 'creatureProperties' }
  });

  // Insert the creature properties
  // @ts-expect-error Batch insert not defined
  CreatureProperties.batchInsert(nodes);
  return node;
}

export default addCreaturesFromLibraryToTabletop;
