const Doctor = require("../models/doctor.model");
const catchAsync = require("../utils/catchAsync");
const Login = require("../models/login.model");
const Patient = require("../models/patient.model");
const bcrypt = require("bcryptjs");

module.exports = {
    addDoctorController: catchAsync(async (req, res) => {
        const { email, username } = req.body;
        const { password, ...details } = req.body;
        let doctor = await Doctor.findOne({ email });
        if (doctor) res.status(400).send({ error: "Email already added" });

        doctor = await Doctor.findOne({ username });
        if (doctor) res.status(400).send({ error: "Username already added" });

        doctor = await Login.create({
            username,
            email,
            password,
            role: "doctor",
        });
        const salt = await bcrypt.genSalt(10);

        doctor.password = await bcrypt.hash(doctor.password, salt);

        doctor.save({ validateBeforeSave: false });

        doctor = await Doctor.create(details);

        await doctor.save({ validateBeforeSave: true });

        res.status(200).json({
            success: true,
            message: `Doctor Added Successfull.`,
            doctor,
        });
    }),

    getAllDoctorsController: catchAsync(async (req, res) => {
        const search = req.query.search || "";
        const rgx = (pattern) => new RegExp(`.*${pattern}.*`);
        const searchRgx = rgx(search);

        let doctors = await Doctor.find({
            $or: [
                {
                    firstname: { $regex: searchRgx, $options: "i" },
                },
                {
                    lastname: { $regex: searchRgx, $options: "i" },
                },
                {
                    email: { $regex: searchRgx, $options: "i" },
                },
                {
                    username: { $regex: searchRgx, $options: "i" },
                },
            ],
        });

        res.status(200).json({
            success: true,
            message: `Successfull.`,
            doctors,
        });
    }),

    getDoctorController: catchAsync(async (req, res) => {
        let { id } = req.params;
        const doctor = await Doctor.findById(id).populate(
            "department patients"
        );
        res.status(200).json({
            success: true,
            message: `Successfull.`,
            doctor,
        });
    }),

    updateDoctorController: catchAsync(async (req, res) => {
        let { id } = req.params;
        let doctor = await Doctor.findById(id);

        if (!doctor)
            return res
                .status(400)
                .send({ success: false, message: "Invalid doctor Id" });

        doctor = await Doctor.findByIdAndUpdate(
            id,
            {
                $set: req.body,
            },
            {
                new: true,
                runValidators: true,
            }
        );

        res.status(200).json({
            success: true,
            message: `Successfull.`,
            doctor,
        });
    }),

    deleteDoctorController: catchAsync(async (req, res) => {
        let { id } = req.params;

        let doctor = await Doctor.findById(id);

        if (!doctor)
            return res
                .status(400)
                .send({ success: false, message: "Invalid doctor Id" });

        await Doctor.findByIdAndDelete(id);

        await Login.where({ email: doctor.email }).deleteOne();
        res.status(200).json({ succcess: true, message: "successful" });
    }),

    searchDoctorController: catchAsync(async (req, res) => {
        const search = req.query.search || "";

        if (search === "")
            return res.status(200).json({
                success: true,
                message: `Successfull.`,
                results: [],
            });

        const rgx = (pattern) => new RegExp(`.*${pattern}.*`);
        const searchRgx = rgx(search);

        const results = await Doctor.find({
            $or: [
                {
                    firstname: { $regex: searchRgx, $options: "i" },
                },
                {
                    lastname: { $regex: searchRgx, $options: "i" },
                },
                {
                    email: { $regex: searchRgx, $options: "i" },
                },
                {
                    username: { $regex: searchRgx, $options: "i" },
                },
            ],
        }).populate("department");
        res.status(200).json({
            success: true,
            message: `Successfull.`,
            results,
        });
    }),

    makeDoctorAdminController: catchAsync(async (req, res) => {
        let { id } = req.params;
        let doctor = await Doctor.findById(id);

        if (!doctor)
            return res
                .status(400)
                .send({ success: false, message: "Invalid doctor Id" });

        doctor = await Doctor.findByIdAndUpdate(
            id,
            {
                $set: { isAdmin: true },
            },
            {
                new: true,
                runValidators: true,
            }
        );

        res.status(200).json({
            success: true,
            message: `Successfull.`,
            doctor,
        });
    }),

    revokeDoctorAdminController: catchAsync(async (req, res) => {
        let { id } = req.params;
        let doctor = await Doctor.findById(id);

        if (!doctor)
            return res
                .status(400)
                .send({ success: false, message: "Invalid doctor Id" });

        doctor = await Doctor.findByIdAndUpdate(
            id,
            {
                $set: { isAdmin: false },
            },
            {
                new: true,
                runValidators: true,
            }
        );

        res.status(200).json({
            success: true,
            message: `Successfull.`,
            doctor,
        });
    }),

    getAssignedPatientsController: catchAsync(async (req, res) => {
        let { id } = req.params;
        let doctor = await Doctor.findById(id);

        if (!doctor)
            return res
                .status(400)
                .send({ success: false, message: "Invalid doctor Id" });

        let patients = await Patient.find({
            doctors: { $in: [id] },
        });

        res.status(200).json({
            success: true,
            message: `Successfull.`,
            patients,
        });
    }),
};
