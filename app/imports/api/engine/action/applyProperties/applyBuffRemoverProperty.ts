import { PropTask } from '/imports/api/engine/action/tasks/Task';
import TaskResult from 'imports/api/engine/action/tasks/TaskResult';
import getPropertyTitle from '/imports/api/utility/getPropertyTitle';
import { findLast, filter, difference, intersection } from 'lodash';
import { getPropertiesOfType, getPropertyAncestors } from '/imports/api/engine/loadCreatures';
import getEffectivePropTags from '/imports/api/engine/computation/utility/getEffectivePropTags';
import { applyDefaultAfterPropTasks } from '/imports/api/engine/action/functions/applyTaskGroups';
import { EngineAction } from '/imports/api/engine/action/EngineActions';

export default function applyBuffRemoverProperty(
  task: PropTask, action: EngineAction, result: TaskResult, userInput
) {
  const prop = task.prop;

  if (prop.name && !prop.silent) {
    // Log Name
    result.appendLog({
      name: getPropertyTitle(prop),
    }, task.targetIds)
  }

  // Remove buffs
  if (prop.targetParentBuff) {
    // Remove nearest ancestor buff
    const ancestors = getPropertyAncestors(action.creatureId, prop._id);
    const nearestBuff = findLast(ancestors, ancestor => ancestor.type === 'buff');
    if (!nearestBuff) {
      result.appendLog({
        name: 'Error',
        value: 'Buff remover does not have a parent buff to remove',
      }, task.targetIds);
      return;
    }
    removeBuff(nearestBuff, prop, result);
  } else {
    // Get all the buffs targeted by tags
    const allBuffs = getPropertiesOfType(action.creatureId, 'buff');
    const targetedBuffs = filter(allBuffs, buff => {
      if (buff.inactive) return false;
      if (buffRemoverMatchTags(prop, buff)) return true;
    });
    // Remove the buffs
    if (prop.removeAll) {
      // Remove all matching buffs
      targetedBuffs.forEach(buff => {
        removeBuff(buff, prop, result);
      });
    } else {
      // Sort in reverse order
      targetedBuffs.sort((a, b) => b.order - a.order);
      // Remove the one with the highest order
      const buff = targetedBuffs[0];
      if (buff) {
        removeBuff(buff, prop, result);
      }
    }
  }
  applyDefaultAfterPropTasks(action, prop, task.targetIds, userInput);
}

function removeBuff(buff: any, prop, result: TaskResult) {
  result.mutations.push({
    targetIds: result.targetIds,
    removals: [{ propId: buff._id }],
    contents: [{
      name: 'Removed',
      value: `${buff.name || 'Buff'}`,
      silenced: prop.silent,
    }],
  });
}

function buffRemoverMatchTags(buffRemover, prop) {
  let matched = false;
  const propTags = getEffectivePropTags(prop);
  // Check the target tags
  if (
    !buffRemover.targetTags?.length ||
    difference(buffRemover.targetTags, propTags).length === 0
  ) {
    matched = true;
  }
  // Check the extra tags
  buffRemover.extraTags?.forEach(extra => {
    if (extra.operation === 'OR') {
      if (matched) return;
      if (
        !extra.tags.length ||
        difference(extra.tags, propTags).length === 0
      ) {
        matched = true;
      }
    } else if (extra.operation === 'NOT') {
      if (
        extra.tags.length &&
        intersection(extra.tags, propTags)
      ) {
        return false;
      }
    }
  });
  return matched;
}