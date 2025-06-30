const materialModel = require("../models/materialModel");

const materialController = {
  async getAllMaterials(req, res) {
    try {
      const materials = await materialModel.getAllMaterials();
      res.status(200).json({ materials });
    } catch (error) {
      console.error("Get materials error:", error);
      res.status(500).json({ error: "Failed to fetch materials", details: error.message });
    }
  },

  async addMaterial(req, res) {
    try {
      const { lesson_id, chapter_title, explanation, formulas, examples } = req.body;
      if (!lesson_id || !chapter_title || !explanation) {
        return res.status(400).json({ error: "Missing required fields: lesson_id, chapter_title, explanation" });
      }

      const material = await materialModel.addMaterial({ lesson_id, chapter_title, explanation, formulas, examples });
      res.status(201).json({ message: "Material added successfully", material });
    } catch (error) {
      console.error("Add material error:", error);
      res.status(500).json({ error: "Failed to add material", details: error.message });
    }
  },

  async deleteMaterial(req, res) {
    try {
      const { materialId } = req.params;
      await materialModel.deleteMaterial(materialId);
      res.status(200).json({ message: "Material deleted successfully" });
    } catch (error) {
      console.error("Delete material error:", error);
      res.status(500).json({ error: "Failed to delete material", details: error.message });
    }
  },

  async updateMaterial(req, res) {
    try {
      const { materialId } = req.params;
      const { lesson_id, chapter_title, explanation, formulas, examples } = req.body;
      if (!lesson_id && !chapter_title && !explanation && !formulas && !examples) {
        return res.status(400).json({ error: "At least one field is required for update" });
      }

      await materialModel.updateMaterial(materialId, { lesson_id, chapter_title, explanation, formulas, examples });
      res.status(200).json({ message: "Material updated successfully" });
    } catch (error) {
      console.error("Update material error:", error);
      res.status(500).json({ error: "Failed to update material", details: error.message });
    }
  },
};

module.exports = materialController;