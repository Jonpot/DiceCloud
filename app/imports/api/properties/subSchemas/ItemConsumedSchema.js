import SimpleSchema from 'simpl-schema';
import { Random } from 'meteor/random';
import { storedIconsSchema } from '/imports/api/icons/Icons.js';
import STORAGE_LIMITS from '/imports/constants/STORAGE_LIMITS.js';
import createPropertySchema from '/imports/api/properties/subSchemas/createPropertySchema.js';

const ItemConsumedSchema = createPropertySchema({
  _id: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    autoValue(){
      if (!this.isSet) return Random.id();
    }
  },
  tag: {
    type: String,
    optional: true,
  },
  quantity: {
    type: 'fieldToCompute',
    optional: true,
  },
  itemId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    optional: true,
  },
});

const ComputedOnlyItemConsumedSchema = new SimpleSchema({
  available: {
    type: Number,
    optional: true,
  },
  quantity: {
    type: 'computedOnlyField',
    optional: true,
  },
  itemName: {
    type: String,
    max: STORAGE_LIMITS.name,
    optional: true,
  },
  itemIcon: {
    type: storedIconsSchema,
    optional: true,
    max: STORAGE_LIMITS.icon,
  },
  itemColor: {
    type: String,
    optional: true,
    regEx: /^#([a-f0-9]{3}){1,2}\b$/i,
  },
});

const ComputedItemConsumedSchema = new SimpleSchema()
  .extend(ItemConsumedSchema)
  .extend(ComputedOnlyItemConsumedSchema);

export {
  ItemConsumedSchema,
  ComputedOnlyItemConsumedSchema,
  ComputedItemConsumedSchema
};
