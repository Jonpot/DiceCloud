import SimpleSchema from 'simpl-schema';
import schema from '/imports/api/schema.js';
import { PropertySchema } from '/imports/api/creature/properties/Properties.js'

// Mixins
import recomputeCreatureMixin from '/imports/api/creature/mixins/recomputeCreatureMixin.js';
import creaturePermissionMixin from '/imports/api/creature/mixins/creaturePermissionMixin.js';
import { setDocToLastMixin } from '/imports/api/creature/mixins/setDocToLastMixin.js';
import { setDocAncestryMixin, ensureAncestryContainsCharIdMixin } from '/imports/api/creature/parenting/parenting.js';
import simpleSchemaMixin from '/imports/api/creature/mixins/simpleSchemaMixin.js';
import propagateInheritanceUpdateMixin from '/imports/api/creature/mixins/propagateInheritanceUpdateMixin.js';
import updateSchemaMixin from '/imports/api/creature/mixins/updateSchemaMixin.js';

let Effects = new Mongo.Collection('effects');

/*
 * Effects are reason-value attached to skills and abilities
 * that modify their final value or presentation in some way
 */
let EffectSchema = schema({
	_id: {
		type: String,
		regEx: SimpleSchema.RegEx.Id,
		autoValue(){
			if (!this.isSet) return Random.id();
		}
	},
	name: {
		type: String,
		optional: true,
	},
	operation: {
		type: String,
		defaultValue: 'add',
		allowedValues: [
			'base',
			'add',
			'mul',
			'min',
			'max',
			'advantage',
			'disadvantage',
			'passiveAdd',
			'fail',
			'conditional',
		],
	},
	calculation: {
		type: String,
		optional: true,
	},
	//which stat the effect is applied to
	stat: {
		type: String,
		optional: true,
	},
});

const EffectComputedSchema = new SimpleSchema({
	// The computed result of the effect
	result: {
		type: SimpleSchema.oneOf(Number, String),
		optional: true,
	},
}).extend(EffectSchema);

Effects.attachSchema(EffectComputedSchema);
Effects.attachSchema(PropertySchema);

const insertEffect = new ValidatedMethod({
  name: 'Effects.methods.insert',
	mixins: [
    creaturePermissionMixin,
    setDocAncestryMixin,
    ensureAncestryContainsCharIdMixin,
		recomputeCreatureMixin,
		setDocToLastMixin,
    simpleSchemaMixin,
  ],
  collection: Effects,
  permission: 'edit',
  schema: EffectSchema,
  run(effect) {
		return Effects.insert(effect);
  },
});

const updateEffect = new ValidatedMethod({
  name: 'Effects.methods.update',
  mixins: [
		recomputeCreatureMixin,
		propagateInheritanceUpdateMixin,
    updateSchemaMixin,
    creaturePermissionMixin,
  ],
  collection: Effects,
  permission: 'edit',
  schema: EffectSchema,
	skipRecompute({update}){
    let fields = getModifierFields(update);
    return !fields.hasAny([
      'operation',
      'calculation',
      'stat',
    ]);
  },
});

export default Effects;
export { EffectSchema };