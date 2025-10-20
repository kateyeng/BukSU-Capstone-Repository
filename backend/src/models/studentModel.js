import mongoose from "mongoose";

//1 create a schema
//2 create a model base on your schema
//3 create a logic on the controller base on the model schema

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, //prevent duplicate emails
        validate: function(value) {
            return value.endsWith("@student.buksu.edu.ph");
        },
        message: "Email must end in @student.buksu.edu.ph"
    },
    password: {
      type: String,
      required: true,

    },
    role: {
        type: String,
        default: "student"
    },
},
    {
        timestamp: true,
        versionKey: false
    }
);

const Student = mongoose.model("Student", studentSchema);

export default Student;