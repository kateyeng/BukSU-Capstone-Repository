import express from "express";
import { getAllTeachers, getTeacher, updateTeacher, deleteTeacher, registerTeacher} from "../controllers/teacherController.js";

const router = express.Router();

router.get("/", getAllTeachers);
router.get("/:id", getTeacher);
router.post("/", registerTeacher);
router.put("/:id", updateTeacher);
router.delete("/:id", deleteTeacher);

export default router;
