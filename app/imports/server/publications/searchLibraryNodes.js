import { check } from 'meteor/check';
import Libraries from '/imports/api/library/Libraries';
import LibraryNodes from '/imports/api/library/LibraryNodes';
import getCreatureLibraryIds from '/imports/api/library/getCreatureLibraryIds';
import getUserLibraryIds from '/imports/api/library/getUserLibraryIds';
import { assertViewPermission } from '/imports/api/sharing/sharingPermissions';
import escapeRegex from '/imports/api/utility/escapeRegex';
import { getFilter } from '/imports/api/parenting/parentingFunctions';

Meteor.publish('selectedLibraryNodes', function (selectedNodeIds) {
  check(selectedNodeIds, Array);
  // Limit to 20 selected nodes
  if (selectedNodeIds.length > 20) {
    selectedNodeIds = selectedNodeIds.slice(0, 20);
  }
  let libraryViewPermissions = {};
  const nodes = [];
  // Check view permissions of all libraries
  for (let id of selectedNodeIds) {
    let node = LibraryNodes.findOne(id);
    if (!node) continue;
    nodes.push(node);
    let libraryId = node.ancestors[0].id;
    if (libraryViewPermissions[id]) {
      continue;
    } else {
      let library = Libraries.findOne(libraryId, {
        fields: {
          owner: 1,
          readers: 1,
          writers: 1,
          public: 1,
          root: 1,
          left: 1,
          right: 1,
        }
      });
      assertViewPermission(library, this.userId);
      libraryViewPermissions[id] = true;
    }
  }
  // Return all nodes and their children
  return [LibraryNodes.find({
    $or: [
      { _id: { $in: selectedNodeIds } },
      { ...getFilter.descendantsOfAll(nodes) },
    ],
  })];
});

Meteor.publish('searchLibraryNodes', function (creatureId) {
  let self = this;
  this.autorun(function () {
    let type = self.data('type');
    if (!type) return [];

    let userId = this.userId;
    if (!userId) {
      return [];
    }

    // Get all the ids of libraries the user can access
    let libraryIds;
    if (creatureId) {
      libraryIds = getCreatureLibraryIds(creatureId, userId)
    } else {
      libraryIds = getUserLibraryIds(userId)
    }

    // Build a filter for nodes in those libraries that match the type
    let filter = {
      ...getFilter.descendantsOfAllRoots(libraryIds),
      removed: { $ne: true },
      searchable: true //library nodes must opt-in
    };
    if (type) {
      filter.$or = [{
        type,
      }, {
        slotFillerType: type,
      }];
    }

    this.autorun(function () {
      // Get the limit of the documents the user can fetch
      var limit = self.data('limit') || 32;
      check(limit, Number);

      // Get the search term
      let searchTerm = self.data('searchTerm') || '';
      check(searchTerm, String);

      let options = undefined;
      if (searchTerm) {
        // Regex search instead of text index
        filter.$and = [{
          $or: [
            { name: { $regex: escapeRegex(searchTerm), '$options': 'i' } },
            { libraryTags: searchTerm },
          ],
        }];
        // filter.$text = {$search: searchTerm};
        options = {
          /*
          // relevant documents have a higher score.
          fields: {
            score: { $meta: 'textScore' }
          },
          */
          sort: {
            // `score` property specified in the projection fields above.
            // score: { $meta: 'textScore' },
            'root.id': 1,
            name: 1,
            left: 1,
          }
        }
      } else {
        //delete filter.$text
        delete filter.$and;
        options = {
          sort: {
            'root.id': 1,
            name: 1,
            left: 1,
          }
        };
      }
      options.limit = limit;

      this.autorun(function () {
        self.setData('countAll', LibraryNodes.find(filter).count());
      });

      let cursor = LibraryNodes.find(filter, options);
      const libraries = Libraries.find({ _id: { $in: libraryIds } });

      Mongo.Collection._publishCursor(libraries, self, 'libraries');

      let observeHandle = cursor.observeChanges({
        added: function (id, fields) {
          fields._searchResult = true;
          self.added('libraryNodes', id, fields);
        },
        changed: function (id, fields) {
          self.changed('libraryNodes', id, fields);
        },
        removed: function (id) {
          self.removed('libraryNodes', id);
        }
      },
        // Publications don't mutate the documents
        { nonMutatingCallbacks: true }
      );

      // register stop callback (expects lambda w/ no args).
      this.onStop(function () {
        observeHandle.stop();
      });
      // this.ready();
    });
  });
});
