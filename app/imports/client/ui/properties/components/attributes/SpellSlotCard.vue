<template>
  <v-card data-id="spell-slot-card">
    <v-list
      v-if="spellSlots.length"
      two-line
      subheader
    >
      <v-subheader>Spell Slots</v-subheader>
      <spell-slot-list-tile
        v-for="spellSlot in spellSlots"
        :key="spellSlot._id"
        :model="spellSlot"
        :data-id="`spell-slot-card-${spellSlot._id}`"
        @click="clickProperty({_id: spellSlot._id})"
      />
    </v-list>
    <div
      v-if="hasSpells"
      class="d-flex justify-end"
    >
      <v-btn
        color="accent"
        style="width: 100%;"
        outlined
        data-id="cast-spell-btn"
        @click="castSpell"
      >
        Cast a spell
      </v-btn>
    </div>
  </v-card>
</template>

<script lang="js">
import SpellSlotListTile from '/imports/client/ui/properties/components/attributes/SpellSlotListTile.vue';
import doAction from '/imports/client/ui/creature/actions/doAction';
import { snackbar } from '/imports/client/ui/components/snackbars/SnackbarQueue';

export default {
  components: {
    SpellSlotListTile,
  },
  props: {
    creatureId: {
      type: String,
      required: true,
    },
    hasSpells: Boolean,
    spellSlots: {
      type: Array,
      default: () => [],
    },
  },
  data(){return {
    castSpellLoading: false,
  }},
  methods: {
    castSpell() {
      this.castSpellLoading = true;
      doAction({
        creatureId: this.model.root.id,
        propId: this.model._id,
        $store: this.$store, 
        elementId: `spell-slot-card-${this.model._id}`
      }).catch(error => {
        snackbar({ text: error.reason || error.message || error.toString() });
        console.error(error);
      }).finally(() => {
        this.castSpellLoading = false;
      });
    },
    clickProperty({ _id }) {
      this.$store.commit('pushDialogStack', {
        component: 'creature-property-dialog',
        elementId: 'cast-spell-btn',
        data: { _id },
      });
    },
  }
}
</script>
