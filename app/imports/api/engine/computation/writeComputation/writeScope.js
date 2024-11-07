import CreatureVariables from '/imports/api/creature/creatures/CreatureVariables';
import Creatures from '/imports/api/creature/creatures/Creatures';
import { EJSON } from 'meteor/ejson';

export default function writeScope(creatureId, computation) {
  if (!creatureId) throw 'creatureId is required';
  const scope = computation.scope;
  let variables = computation.variables;
  // If the variables are not set, check if they can be fetched
  if (!variables) {
    variables = CreatureVariables.findOne({
      _creatureId: creatureId
    });
  }
  // Otherwise create a new variables document
  if (!variables) {
    CreatureVariables.insert({
      _creatureId: creatureId
    });
    variables = {};
  }
  delete variables._id;
  delete variables._creatureId;

  let $set, $unset;

  for (const key in scope) {
    // Mongo can't handle keys that start with a dollar sign
    if (key[0] === '$' || key[0] === '_') continue;

    // Remove empty objects
    if (Object.keys(scope[key]).length === 0) {
      delete scope[key];
      continue;
    }

    // Remove large properties that aren't likely to be accessed
    delete scope[key].parent;

    // Remove empty keys
    for (const subKey in scope[key]) {
      if (scope[key][subKey] === undefined) {
        delete scope[key][subKey]
      }
    }

    // If this is a creature property, replace the property with a link
    if (scope[key]._id && scope[key].type) {
      scope[key] = { _propId: scope[key]._id };
    }

    // Only update changed fields
    if (!EJSON.equals(variables[key], scope[key])) {
      if (!$set) $set = {};
      /* Log detailed diffs
      const diff = omitBy(variables[key], (v, k) => EJSON.equals(scope[key][k], v));
      for (let subkey in diff) {
        console.log(`${key}.${subkey}: ${variables[key][subkey]} => ${scope[key][subkey]}`)
      }
      */
      // Set the changed key in the creature variables
      $set[key] = scope[key];
    }
  }

  // Remove all the keys that no longer exist in scope
  for (const key in variables) {
    if (!scope[key]) {
      if (!$unset) $unset = {};
      $unset[key] = 1;
    }
  }

  if ($set || $unset) {
    const update = {};
    if ($set) update.$set = $set;
    if ($unset) update.$unset = $unset;
    CreatureVariables.update({ _creatureId: creatureId }, update);
  }
  if (computation.creature?.dirty) {
    Creatures.update({ _id: creatureId }, { $unset: { dirty: 1 } });
  }
}
/*
function calculateSize(computation) {
  const sizeEstimator = {
    creature: computation.creature,
    variables: computation.variables,
    props: computation.originalPropsById,
  };
  return MongoInternals.NpmModule.BSON.calculateObjectSize(sizeEstimator, { checkKeys: false })
}
*/
