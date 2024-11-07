import { ActionBase, ActionSchema, ComputedOnlyActionSchema } from '/imports/api/properties/Actions';
import SimpleSchema from 'simpl-schema';
import STORAGE_LIMITS from '/imports/constants/STORAGE_LIMITS';
import { CreatureProperty } from '/imports/api/creature/creatureProperties/CreatureProperties';

export interface Spell extends ActionBase {
  name?: string
  type: 'spell'
  alwaysPrepared?: boolean
  prepared?: boolean
  castWithoutSpellSlots?: boolean
  hasAttackRoll?: boolean
  castingTime?: string
  range?: string
  duration?: string
  verbal?: boolean
  somatic?: boolean
  concentration?: boolean
  material?: string
  ritual?: boolean
  level?: number
  school?: string
}

export function isSpell(prop: CreatureProperty): prop is Spell {
  return prop.type === 'spell';
}

const magicSchools = [
  'abjuration',
  'conjuration',
  'divination',
  'enchantment',
  'evocation',
  'illusion',
  'necromancy',
  'transmutation',
];

const SpellSchema = new SimpleSchema({})
  .extend(ActionSchema)
  .extend({
    name: {
      type: String,
      optional: true,
      max: STORAGE_LIMITS.name,
    },
    // If it's always prepared, it doesn't count against the number of spells
    // prepared in a spell list, and enabled should be true
    alwaysPrepared: {
      type: Boolean,
      optional: true,
    },
    prepared: {
      type: Boolean,
      optional: true,
    },
    // This spell ignores spell slot rules
    castWithoutSpellSlots: {
      type: Boolean,
      optional: true,
    },
    hasAttackRoll: {
      type: Boolean,
      optional: true,
    },
    castingTime: {
      type: String,
      optional: true,
      defaultValue: 'action',
      max: STORAGE_LIMITS.spellDetail,
    },
    range: {
      type: String,
      optional: true,
      max: STORAGE_LIMITS.spellDetail,
    },
    duration: {
      type: String,
      optional: true,
      defaultValue: 'Instantaneous',
      max: STORAGE_LIMITS.spellDetail,
    },
    verbal: {
      type: Boolean,
      optional: true,
    },
    somatic: {
      type: Boolean,
      optional: true,
    },
    concentration: {
      type: Boolean,
      optional: true,
    },
    material: {
      type: String,
      optional: true,
      max: STORAGE_LIMITS.spellDetail,
    },
    ritual: {
      type: Boolean,
      optional: true,
    },
    level: {
      type: SimpleSchema.Integer,
      defaultValue: 1,
      max: 9,
      min: 0,
    },
    school: {
      type: String,
      defaultValue: 'abjuration',
      allowedValues: magicSchools,
    },
  });

const ComputedOnlySpellSchema = new SimpleSchema({})
  .extend(ComputedOnlyActionSchema);

const ComputedSpellSchema = new SimpleSchema({})
  .extend(SpellSchema)
  .extend(ComputedOnlySpellSchema);

export { SpellSchema, ComputedOnlySpellSchema, ComputedSpellSchema };
