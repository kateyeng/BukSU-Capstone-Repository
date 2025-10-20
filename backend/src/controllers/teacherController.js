import Teacher from "../models/teacherModel.js";

// 1. Validates input (email, password, etc)
// 2. Uses the model to interact with MongoDB
// 3. Sends response (success or error)

// Get all teachers
export async function getAllTeachers(req, res) {
    try {
        const teachers = await Teacher.find();
        res.status(200).json(teachers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Get one specific teacher
export async function getTeacher(req, res) {
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found!" });
        }

        res.status(200).json(teacher);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Update teacher profile
export async function updateTeacher(req, res) {
    try {
        const updatedTeacher = await Teacher.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!updatedTeacher) {
            return res.status(404).json({ message: "Teacher not found!" });
        }

        res.status(200).json({
            message: "Teacher updated successfully!",
            teacher: updatedTeacher
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Delete teacher
export async function deleteTeacher(req, res) {
    try {
        const teacher = await Teacher.findById(req.params.id);

        if (!teacher) {
            return res.status(404).json({ message: "Teacher ID does not exist!" });
        }

        await Teacher.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Teacher has been deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Register new teacher
export async function registerTeacher(req, res) {
    try {
        const { name, email, password } = req.body;

        // Optional: enforce email pattern for teachers
        if (!email.endsWith("@teacher.buksu.edu.ph")) {
            return res.status(400).json({ message: "Invalid email! Use your @teacher.buksu.edu.ph email address." });
        }

        // Check for existing email
        const existingTeacher = await Teacher.findOne({ email });
        if (existingTeacher) {
            return res.status(400).json({ message: "Email already exists! Use another email." });
        }

        // Save new teacher
        const newTeacher = new Teacher({ name, email, password });
        await newTeacher.save();

        res.status(201).json({
            message: "Teacher registered successfully!",
            teacher: newTeacher
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export default Teacher;
