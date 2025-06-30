const admin = require("firebase-admin");

const materialModel = {
  async getAllMaterials() {
    const db = admin.database();
    const materialsSnapshot = await db.ref("materials").once("value");
    const materials = materialsSnapshot.val() || {};
    return Object.values(materials);
  },

  async addMaterial({ lesson_id, chapter_title, explanation, formulas, examples }) {
    const db = admin.database();
    const materialRef = db.ref("materials").push();
    const materialData = {
      material_id: materialRef.key,
      lesson_id,
      chapter_title,
      explanation,
      formulas: formulas || [],
      examples: examples || [],
    };

    await materialRef.set(materialData);
    return materialData;
  },

  async deleteMaterial(materialId) {
    const db = admin.database();
    const materialRef = db.ref(`materials/${materialId}`);
    const materialSnapshot = await materialRef.once("value");
    if (!materialSnapshot.exists()) {
      throw new Error("Material not found");
    }

    await materialRef.remove();
  },

  async updateMaterial(materialId, { lesson_id, chapter_title, explanation, formulas, examples }) {
    const db = admin.database();
    const materialRef = db.ref(`materials/${materialId}`);
    const materialSnapshot = await materialRef.once("value");
    if (!materialSnapshot.exists()) {
      throw new Error("Material not found");
    }

    const updateData = {};
    if (lesson_id !== undefined) updateData.lesson_id = lesson_id;
    if (chapter_title !== undefined) updateData.chapter_title = chapter_title;
    if (explanation !== undefined) updateData.explanation = explanation;
    if (formulas !== undefined) updateData.formulas = formulas;
    if (examples !== undefined) updateData.examples = examples;

    await materialRef.update(updateData);
  },
};

module.exports = materialModel;