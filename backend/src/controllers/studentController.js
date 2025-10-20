import Student from "../models/studentModel.js";


//1. Validates the input (email,password, etc)
//2. use the model to interact with the MonoDB
//3. sends a response either success or error

//get all the students registered
export async function getAllstudent(req, res) {
    try {
        const student = await Student.find();
        res.status(200).json(student);
    } catch(error) {
        res.status(500).json({message: error.message});
    }
}

//get one specific student
export async function getStudent(req, res) {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({message: "student not found!"});
        }

        res.status(200).json(student);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

//update student profile
export async function updateStudent(req, res) {
    try{
        const updateStudent = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true});
        res.status(200).json({message: "Student updated successfully!", student: updateStudent});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

//delete student
export async function deleteStudent(req, res) {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({ message: "Student ID does not exist!"});
        }

        await Student.findByIdAndDelete(req.params.id);
        res.status(200).json({message: "Student has been deleted successfully!"});

    } catch (error){
        res.status(500).json({message: error.message});
    }
}

//register a new student
export async function registerStudent (req, res) {
    try{
        const { name, email, password} = req.body;

        if (!email.endsWith("@student.buksu.edu.ph")) {
            return res.status(400).json({message: "invalide email use the exact email pattern! @student.buksu.edu.ph"});
        } 

        const existingStudent = await Student.findOne({ email });
        if (existingStudent) {
            return res.status(400).json({message: "email already exist use another email"});
        }

        const newStudent = new Student({name, email, password });
        await newStudent.save();

        res.status(201).json({
            message: "Student registered successfully!",
            student: newStudent,
        }); } catch (error) {
            res.status(500).json({message: error.message});
    }
}


export default Student;