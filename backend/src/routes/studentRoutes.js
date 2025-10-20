import express from "express"
import { getAllstudent, getStudent, registerStudent, updateStudent, deleteStudent } from "../controllers/studentController.js"

const router = express.Router();

router.get("/", getAllstudent);
router.get("/:id", getStudent);
router.post("/", registerStudent);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);

export default router;