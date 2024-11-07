import migrateProperty2To3 from '/imports/migrations/archive/properties/migrateProperty2To3';

export default function migrate2To3(archive) {
  archive.properties = archive.properties.map(prop => {
    try {
      migrateProperty2To3(prop);
    } catch (e) {
      console.warn('Property migration 2 -> 3 failed: ', { propId: prop._id, error: e.message || e.reason || e.toString() });
    }
    return prop;
  });
}
