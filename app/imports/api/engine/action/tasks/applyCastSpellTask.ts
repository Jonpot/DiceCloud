import { EngineAction } from '/imports/api/engine/action/EngineActions';
import { CastSpellTask } from '/imports/api/engine/action/tasks/Task';
import TaskResult from './TaskResult';
import InputProvider from '/imports/api/engine/action/functions/userInput/InputProvider';
import { getPropertiesOfType, getSingleProperty } from '/imports/api/engine/loadCreatures';
import applyTask from '/imports/api/engine/action/tasks/applyTask';
import applyActionProperty from '../applyProperties/applyActionProperty';

export default async function applySpellProperty(
  task: CastSpellTask, action: EngineAction, result: TaskResult, userInput: InputProvider
): Promise<void> {
  let prop = task.prop;
  // Ask the user how this spell is being cast
  const castOptions = await userInput.castSpell({
    spellId: task.params.spellId,
    slotId: prop?.castWithoutSpellSlots
      ? undefined
      : getSuggestedSpellSlotId(action.creatureId, prop),
    ritual: false,
  });
  if (!castOptions.spellId) {
    result.appendLog({
      name: 'Error casting spell',
      value: 'No spell was selected',
      silenced: false,
    }, [action.creatureId]);
    return;
  }
  // If the user changed the spell they are casting, use that as the prop
  prop = getSingleProperty(action.creatureId, castOptions.spellId);

  if (!prop) {
    result.appendLog({
      name: 'Error casting spell',
      value: 'The chosen spell was not found',
      silenced: false,
    }, [action.creatureId]);
    return;
  }
  let slotLevel = prop.level || 0;
  // Get the slot being cast with
  const slot = castOptions.slotId && getSingleProperty(action.creatureId, castOptions.slotId);
  // Log casting method
  logCastingMessage(slot?.spellSlotLevel?.value, castOptions, result, prop, task.targetIds);
  // Spend the spell slot and change the spell's casting level if a slot is used
  if (slot) {
    await spendSpellSlot(action, castOptions, userInput);
    slotLevel = slot.spellSlotLevel?.value || 0;
  }
  // Add the slot level to the scope
  result.pushScope = {
    '~slotLevel': { value: slotLevel },
    'slotLevel': { value: slotLevel },
  };
  // Run the rest of the spell as if it were an action
  return applyActionProperty({
    prop,
    targetIds: task.targetIds,
  }, action, result, userInput);
}

function getSuggestedSpellSlotId(creatureId, prop) {
  if (!prop) return;
  const slots = getPropertiesOfType(creatureId, 'spellSlot')
    .sort((a, b) => a.spellSlotLevel?.value - b.spellSlotLevel?.value)
    .filter(slot => slot.spellSlotLevel.value > prop.level);
  return slots[0]?._id;
}

function logCastingMessage(slotLevel: number, castOptions, result: TaskResult, prop, targetIds: string[]) {
  let message = '';
  // Determine which message to post
  if (slotLevel) {
    message = `Casting using a level ${slotLevel} spell slot`
  } else if (prop.level) {
    if (castOptions.ritual) {
      message = `Ritual casting at level ${slotLevel}`
    } else {
      message = `Casting at level ${slotLevel}`
    }
  }
  // Post the message
  if (message) {
    result.appendLog({
      name: `Casting at level ${slotLevel}`,
      silenced: prop.silent,
    }, targetIds);
  }
}

function spendSpellSlot(action, castOptions, userInput) {
  const slot = getSingleProperty(action.creatureId, castOptions.slotId);
  return applyTask(action, {
    targetIds: [action.creatureId],
    subtaskFn: 'damageProp',
    params: {
      operation: 'increment',
      value: 1,
      targetProp: slot,
    },
  }, userInput);
}
