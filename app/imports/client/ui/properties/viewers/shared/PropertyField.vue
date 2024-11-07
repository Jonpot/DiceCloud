<template lang="html">
  <v-col
    v-if="value !== undefined ||
      calculation !== undefined ||
      ($slots.default && $slots.default.length)"
    v-bind="cols"
    class="mb-3"
  >
    <fieldset
      :class="theme.isDark? 'theme--dark' :'theme--light'"
      class="rounded v-sheet--outlined pa-2 layout column align-start fill-height"
      @click="$emit('click', $event)"
    >
      <legend
        v-if="name"
        class="text-caption px-1 name"
        style="line-height: 0;"
      >
        {{ name }}
      </legend>
      <div
        class="flex-grow-1 d-flex align-center flex-wrap"
        style="width: 100%;"
      >
        <div
          class="d-flex align-center"
          :class="{
            'text-body-1': !isLarge,
            'text-h4': isLarge,
            'justify-center': isCenter,
            'justify-end': end,
            'flex-wrap': wrap,
            'mono': isMono,
            'flex-grow-0': hasEffectsOrProficiencies,
            'flex-grow-1': !hasEffectsOrProficiencies, 
            'ma-3': hasEffectsOrProficiencies,
            ...$attrs.class,
          }"
          style="overflow-x: auto;"
          v-bind="$attrs"
        >
          <slot>
            <template v-if="value !== undefined">
              {{ valueText }}
            </template>
            <template v-else-if="calculation !== undefined">
              {{ calculationText }}
            </template>
          </slot>
        </div>
        <div
          v-if="hasEffectsOrProficiencies"
          class="flex-grow-1"
          style="max-width: 100%;"
        >
          <inline-effect
            v-for="effectId in calculation.effectIds"
            :key="effectId"
            :data-id="effectId"
            :effect-id="effectId"
            @click="clickEffect(effectId)"
          />
          <inline-proficiency
            v-for="proficiencyId in calculation.proficiencyIds"
            :key="proficiencyId"
            :data-id="proficiencyId"
            :proficiency-id="proficiencyId"
            @click="clickEffect(proficiencyId)"
          />
        </div>
        <div
          v-if="hasEffectsOrProficiencies"
          class="d-flex justify-end border-t-sm pt-2"
          style="width: 100%; opacity: 0.5"
        >
          {{ calculation.value }}
        </div>
      </div>
    </fieldset>
  </v-col>
</template>

<script lang="js">
import numberToSignedString from '/imports/api/utility/numberToSignedString';
import InlineEffect from '/imports/client/ui/properties/components/effects/InlineEffect.vue';
import InlineProficiency from '/imports/client/ui/properties/components/proficiencies/InlineProficiency.vue';

export default {
  components: {
    InlineEffect,
    InlineProficiency,
  },
  inject: {
    theme: {
      default: {
        isDark: false,
      },
    },
  },
  props: {
    name: {
      type: String,
      default: undefined,
    },
    value: {
      type: [String, Number, Boolean],
      default: undefined,
    },
    calculation: {
      type: Object,
      default: undefined,
    },
    center: Boolean,
    end: Boolean,
    large: Boolean,
    mono: Boolean,
    signed: Boolean,
    wrap: Boolean,
    cols: {
      type: Object,
      default: () => ({cols: 12, sm: 6, md: 4}),
    },
  },
  computed: {
    showCalculationInsteadOfValue(){
      if (!this.calculation) return;
      return this.calculation && this.calculation.value === undefined;
    },
    valueNotReduced(){
      if (!this.calculation) return;
      return typeof this.calculation.value === 'string'
    },
    valueText() {
      if (this.signed) {
        return numberToSignedString(this.value);
      } else {
        return this.value;
      }
    },
    calculationText(){
      const calculation = this.calculation;
      if (!calculation) {
        return undefined;
      }
      if (calculation.value === undefined){
        return calculation.calculation;
      }
      if (this.signed) {
        return numberToSignedString(calculation.value);
      }
      if (this.hasEffectsOrProficiencies) {
        return calculation.unaffected;
      }
      return calculation.value;
    },
    // large and center are only applied to calculations if we are showing their
    // value, if we are showing the calculation itself, large and center are
    // turned off
    isLarge(){
      if (this.showCalculationInsteadOfValue) return false;
      if (this.valueNotReduced) return false;
      return this.large;
    },
    isCenter(){
      if (this.showCalculationInsteadOfValue) return false;
      if (this.valueNotReduced) return false;
      return this.center;
    },
    isMono(){
      if (this.showCalculationInsteadOfValue) return true;
      if (this.valueNotReduced) return true;
      return this.mono;
    },
    hasEffects(){
      return this.calculation?.effectIds?.length > 0;
    },
    hasProficiencies(){
      return this.calculation?.proficiencyIds?.length > 0;
    },
    hasEffectsOrProficiencies() {
      return this.hasEffects || this.hasProficiencies;
    },
  },
  methods: {
    numberToSignedString,
    clickEffect(id){
      this.$store.commit('pushDialogStack', {
        component: 'creature-property-dialog',
        elementId: `${id}`,
        data: {_id: id},
      });
    },
  }
}
</script>

<style lang="css" scoped>
.name {
  color: rgba(0,0,0,.6);
}
.theme--dark .name {
  color: rgba(255,255,255,.6);
}
.mono {
  font-family: monospace !important;
}
</style>
