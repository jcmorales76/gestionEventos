const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const {
  getConfiguracion,
  updateConfiguracion,
  uploadLogo,
  getLogo,
} = require("../controllers/configController");

router.get("/", getConfiguracion);
router.put("/:clave", updateConfiguracion);
router.post("/logo", upload.single("logo"), uploadLogo);
router.get("/logo", getLogo);

module.exports = router;
