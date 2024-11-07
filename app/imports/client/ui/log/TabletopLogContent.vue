<template lang="html">
  <div class="log-content">
    <div
      v-for="(contentGroup, index) in contentByTargetId"
      :key="index"
    >
      <h3
        v-if="contentGroup.targetIds.length"
        class="content-target-ids"
      >
        <v-icon>mdi-chevron-right</v-icon>
        <v-list-item-avatar
          v-for="creature in contentGroup.targetCreatures"
          :key="creature._id"
          :color="model.color || 'grey'"
          size="32"
        >
          <img
            v-if="creature.avatarPicture"
            :src="creature.avatarPicture"
            :alt="creature.name"
          >
          <span v-else>
            {{ creature.name && creature.name[0] || '?' }}
          </span>
        </v-list-item-avatar>
      </h3>
      <div
        v-for="(content, contentIndex) in contentGroup.content"
        :key="contentIndex"
        class="content-line"
      >
        <h4
          class="content-name"
          style="min-height: 12px;"
        >
          {{ content.name }}
        </h4>
        <markdown-text
          v-if="content.value"
          class="content-value"
          :markdown="content.value"
        />
        <div
          v-else
          style="min-height: 12px;"
        />
      </div>
    </div>
  </div>
</template>

<script lang="js">
import { isEqual } from 'lodash';
import MarkdownText from '/imports/client/ui/components/MarkdownText.vue';
import Creatures from '/imports/api/creature/creatures/Creatures';

export default {
  components: {
    MarkdownText,
  },
  props: {
    model: {
      type: Array,
      default: () => [],
    },
    showSilenced: {
      type: Boolean,
      default: false,
    },
  },
  meteor: {
    contentByTargetId() {
      const content = [];
      const creaturesById = {};
      const getCreature = creatureId => {
        if (creaturesById[creatureId]) return creaturesById[creatureId];
        return creaturesById[creatureId] = Creatures.findOne(creatureId, {
          fields: { _id: 1, avatarPicture: 1, name: 1 },
        });
      };
      let currentContent = undefined;
      const filteredModel = this.model
        .filter(contentItem => !contentItem.silenced || this.showSilenced);
      for (const contentItem of filteredModel) {
        if (!currentContent || !isEqual(currentContent.targetIds, contentItem.targetIds)) {
          if (currentContent) {
            content.push(currentContent);
          }
          currentContent = {
            targetIds: contentItem.targetIds,
            targetCreatures: contentItem.targetIds.map(getCreature),
            content: [contentItem],
          };
        } else {
          currentContent.content.push(contentItem);
        }
      }
      currentContent && content.push(currentContent);
      return content;
    }
  }
}
</script>

<style lang="css" scoped>
.content-line {
  min-height: 24px;
  margin-top: 8px;
  margin-bottom: 2px;
}
/** change the first content line to have no margin top*/
.content-line:first-of-type {
  margin-top: 0;
}

.content-line .details {
  display: inline-block;
}
</style>

<style lang="css">
  .log-content .content-value > p:last-of-type{
    margin-bottom: 0;
  }
</style>
