import { CheckParams } from '/imports/api/engine/action/functions/userInput/InputProvider';

type Task = PropTask | DamagePropTask | ItemAsAmmoTask | CheckTask | ResetTask | CastSpellTask;

export default Task;

type BaseTask = {
  targetIds: string[];
  silent?: boolean | undefined;
}

type Prop = {
  _id: string;
  type: string;
  [key: string]: any,
}

export type PropTask = BaseTask & {
  prop: Prop;
  subtaskFn?: undefined;
  silent?: undefined;
}

export type DamagePropTask = BaseTask & {
  subtaskFn: 'damageProp';
  params: {
    /**
     * Use getPropertyTitle(prop) to set the title
     */
    title?: string;
    operation: 'increment' | 'set';
    value: number;
    targetProp: Prop;
  };
}

export type ItemAsAmmoTask = BaseTask & {
  subtaskFn: 'consumeItemAsAmmo';
  prop: Prop;
  silent?: undefined;
  params: {
    value: number;
    item: any;
    skipChildren: boolean;
  };
}

export type CheckTask = BaseTask & CheckParams & {
  subtaskFn: 'check';
}

export type ResetTask = BaseTask & {
  subtaskFn: 'reset';
  eventName: string;
  // One and only one target
  targetIds: [string];
}

export type CastSpellTask = BaseTask & {
  prop?: Prop | undefined;
  silent?: undefined;
  subtaskFn: 'castSpell';
  params: {
    spellId: string | undefined;
  };
}
