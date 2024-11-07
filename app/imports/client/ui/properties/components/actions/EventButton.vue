<template lang="html">
  <v-btn
    :disabled="context.editPermission === false"
    :data-id="`event-btn-${model._id}`"
    outlined
    class="event-button"
    style="min-width: 160px; max-width: 100%;"
    :color="model.color"
    @click="doAction"
  >
    <property-icon
      style="margin-left: -4px; margin-right: 8px;"
      :model="model"
    />
    <div
      class="text-truncate"
    >
      {{ model.name }}
    </div>
  </v-btn>
</template>

<script lang="js">
import doAction from '/imports/client/ui/creature/actions/doAction';
import PropertyIcon from '/imports/client/ui/properties/shared/PropertyIcon.vue';
import { snackbar } from '/imports/client/ui/components/snackbars/SnackbarQueue';

export default {
  components: {
    PropertyIcon,
  },
  inject: {
    context: { default: {} }
  },
  props: {
    model: {
      type: Object,
      required: true,
    },
  },
  data(){return {
    hovering: false,
    loading: false,
  }},
  methods: {
    async doAction() {
      this.loading = true;
      doAction({
        propId: this.model._id,
        creatureId: this.model.root.id,
        $store: this.$store,
        elementId: `event-btn-${this.model._id}`,
      }).catch(error => {
        snackbar({ text: error.reason || error.message || error.toString() });
        console.error(error);
      }).finally(() => {
        this.loading = false;
      });
    },
  }
}
</script>

<style lang="css">
.event-button .v-btn__content {
  max-width: 100%;
}
</style>
