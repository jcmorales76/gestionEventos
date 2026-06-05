const express = require("express");
const router = express.Router();
const {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  resetPassword,
} = require("../controllers/usuarioController");

router.get("/", getUsuarios);
router.post("/", createUsuario);
router.put("/:id", updateUsuario);
router.delete("/:id", deleteUsuario);
router.put("/:id/reset-password", resetPassword);

module.exports = router;
