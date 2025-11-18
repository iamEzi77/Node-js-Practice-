const express = require("express");
const { PrismaClient } = require("@prisma/client");
const cryptojs = require("crypto-js");
const jwt = require("jsonwebtoken");
const middleware = require("./authmiddleWare");
const { adminMiddleWare, adminOrStudent } = require("./rolemiddleware");
const app = express();

app.use(express.json());

const prisma = new PrismaClient();

const secratKey = process.env.KEY;

////////////////////////////////////

// get all user

///////////////////////////////////

app.post("/user/all", [middleware, adminMiddleWare], async (req, res) => {
  try {
    const user = await prisma.user.findMany();
    console.log(user);
    res.status(201).json(user);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch users" });
    console.log("Error in fetching data", e);
  }
});

//////////////////////////////////////////

// get All the STUDENT

/////////////////////////////////////////

app.get("/student/all", [middleware, adminMiddleWare], async (req, res) => {
  try {
    const allStudent = await prisma.user.findMany({
      where: { role: "STUDENT" },
    });
    res
      .status(201)
      .json({ messgae: "Fetching data successfully ", allStudent });
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch data", e });
  }
});

//////////////////////////////////////////

// get All the INSTRUCTOR

/////////////////////////////////////////

app.get("/instructor/all", [middleware, adminMiddleWare], async (req, res) => {
  try {
    const instructor = await prisma.user.findMany({
      where: { role: "INSTRUCTOR" },
    });
    res.status(201).json({ message: "Fetching data successfully", instructor });
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch data", e });
  }
});

//////////////////////////////////////////

// getting all student its enrolled coures and instructor of the course

/////////////////////////////////////////

app.get("/student/detail", [middleware, adminOrStudent], async (req, res) => {
  try {
    const student = await prisma.user.findMany({
      where: { role: "STUDENT" },
      include: {
        coursesEnrolled: {
          include: {
            instructor: true,
          },
        },
      },
    });
    res.status(201).json({
      messages: "Student detail",
      student,
    });
  } catch (e) {
    res.status(500).json({ message: "Fetching error", e });
  }
});

//////////////////////////////////////////

// login

////////////////////////////////////////

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    if (!user) {
      return res.status(401).json({ error: "user not found" });
    } else {
      const ciphertext = cryptojs.AES.decrypt(user.password, secratKey);
      const decryptPassword = ciphertext.toString(cryptojs.enc.Utf8);
      if (decryptPassword !== password) {
        return res.status(401).json({ message: "incorrect password" });
      }
      const token = jwt.sign(payload, secratKey);
      res.status(200).json({
        message: "user login",
        data: {
          payload,
          jwtToken: token,
        },
      });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "login failed" });
  }
});

///////////////////////////////////////

// only admin can create user

///////////////////////////////////////

app.post("/user/create", [middleware, adminMiddleWare], async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const ciphertext = cryptojs.AES.encrypt(password, secratKey).toString();
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: ciphertext,
        role,
      },
    });
    res.status(201).json(user);
  } catch (e) {
    console.log(e);
  }
});

//////////////////////////////

// password update

////////////////////////////

app.patch("/forgot-Password", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "user not found" });
    } else {
      const ciphertext = cryptojs.AES.encrypt(password, secratKey).toString();
      await prisma.user.update({
        where: { email },
        data: { password: ciphertext },
      });
      return res.status(201).json({ message: "password update" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Login failed" });
  }
});

// ///////////

// get all courses

///////////////

app.get("/course/all", [middleware, adminOrStudent], async (req, res) => {
  try {
    const allCouses = await prisma.course.findMany();
    console.log(allCouses);
    res.status(200).json(allCouses);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetching data" });
    console.log(e);
  }
});

//////////////////////////////////////

//  Admin only create courses and also assign instructor

////////////////////////////////////////

app.post("/course/create", [middleware, adminMiddleWare], async (req, res) => {
  const courseData = req.body;
  try {
    const course = await prisma.course.create({ data: courseData });
    res.status(201).json({
      message: "course is created and Instructor is assign ",
      data: course,
    });
  } catch (e) {
    res.status(500).json({ Error: "Course not created" });
    console.log(e);
  }
});

//////////////////////////////////

// student and admin both enrolled the courses

/////////////////////////////////

app.post("/student/courses", [middleware, adminOrStudent], async (req, res) => {
  const {
    courseCode,
    studentIds,
    courseEnroll = [],
    courseDisEnroll = [],
  } = req.body;
  const students = await prisma.user.findMany({
    where: { id: { in: studentIds } },
  });
  if (students.length === 0) {
    return res.status(404).json({ message: "Some students do not exist" });
  } else {
    if (courseEnroll.length > 0 && courseDisEnroll.length === 0) {
      try {
        for (const courseCode of courseEnroll) {
          const studentEnrolled = await prisma.course.update({
            where: { courseCode },
            data: {
              students: {
                connect: studentIds.map((id) => ({ id })),
              },
            },
            include: {
              students: true,
              instructor: true,
            },
          });
        }
        res.status(201).json({
          message: "Students successfully enrolled in the course",
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Course not enrolled" });
      }
    }
  }

  if (courseDisEnroll.length > 0 && courseEnroll.length === 0) {
    try {
      for (const courseCode of courseDisEnroll) {
        const studentEnrolled = await prisma.course.update({
          where: { courseCode },
          data: {
            students: {
              disconnect: studentIds.map((id) => ({ id })),
            },
          },
          include: {
            students: true,
            instructor: true,
          },
        });
      }
      res.status(201).json({
        message: "Students successfully DisEnrolled in the course",
        data: studentEnrolled,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Course not enrolled" });
    }
  }
});

module.exports = app;
