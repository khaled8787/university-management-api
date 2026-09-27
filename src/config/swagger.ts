import type { OpenAPIV3 } from "openapi-types";

export const swaggerSpec: OpenAPIV3.Document = {
  openapi: "3.0.3",

  info: {
    title: "University Management API",
    version: "1.0.0",
    description:
      "Backend REST API for University Management System. Includes authentication, students, faculties, departments, courses, enrollments, attendance, results, payments, audit logs, and Google authentication.",
  },

  servers: [
    {
      url: "http://localhost:5000/api/v1",
      description: "Local development server",
    },
    {
      url: "https://your-production-api-url/api/v1",
      description: "Production server",
    },
  ],

  tags: [
    { name: "Health", description: "API health check" },
    { name: "Authentication", description: "Authentication APIs" },
    { name: "Departments", description: "Department management" },
    { name: "Students", description: "Student management" },
    { name: "Faculties", description: "Faculty management" },
    { name: "Courses", description: "Course management" },
    { name: "Enrollments", description: "Course enrollment management" },
    { name: "Attendance", description: "Attendance management" },
    { name: "Results", description: "Academic result management" },
    { name: "Payments", description: "Payment and Stripe APIs" },
    { name: "Audit Logs", description: "Admin audit log APIs" },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Enter JWT access token. Example: Bearer eyJhbGciOiJIUzI1NiIs...",
      },
    },

    schemas: {
      SuccessResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
            example: "Request successful",
          },
          data: {},
        },
      },

      ErrorResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          message: {
            type: "string",
            example: "Something went wrong",
          },
          errors: {
            type: "array",
            items: {},
          },
        },
      },
    },
  },

  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Check API health",
        responses: {
          "200": {
            description: "API is healthy",
          },
        },
      },
    },
    "/auth/register": {
  post: {
    tags: ["Authentication"],
    summary: "Register a new user",
    description:
      "Create a new STUDENT or FACULTY account using email/password authentication.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name", "email", "password", "role"],
            properties: {
              name: {
                type: "string",
                example: "Khaled Mahmud",
              },
              email: {
                type: "string",
                format: "email",
                example: "khaled@example.com",
              },
              password: {
                type: "string",
                format: "password",
                example: "StrongPassword123!",
              },
              role: {
                type: "string",
                enum: ["STUDENT", "FACULTY"],
                example: "STUDENT",
              },
              phone: {
                type: "string",
                example: "+8801700000000",
              },
            },
          },
        },
      },
    },
    responses: {
      "201": {
        description: "User registered successfully",
      },
      "400": {
        description: "Validation or registration error",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
    },
  },
},

"/auth/login": {
  post: {
    tags: ["Authentication"],
    summary: "Login with email and password",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["email", "password"],
            properties: {
              email: {
                type: "string",
                format: "email",
                example: "khaled@example.com",
              },
              password: {
                type: "string",
                format: "password",
                example: "StrongPassword123!",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Login successful",
      },
      "401": {
        description: "Invalid email or password",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
    },
  },
},

"/auth/google": {
  post: {
    tags: ["Authentication"],
    summary: "Login or register with Google",
    description:
      "Authenticate a user using a Google/Firebase ID token. New users can be created through Google authentication.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["idToken"],
            properties: {
              idToken: {
                type: "string",
                example: "eyJhbGciOiJSUzI1NiIs...",
              },
              role: {
                type: "string",
                enum: ["STUDENT", "FACULTY"],
                example: "STUDENT",
              },
              phone: {
                type: "string",
                example: "+8801700000000",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Google authentication successful",
      },
      "201": {
        description: "New Google user created successfully",
      },
      "401": {
        description: "Invalid Google ID token",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
    },
  },
},

"/auth/refresh-token": {
  post: {
    tags: ["Authentication"],
    summary: "Generate a new access token",
    description:
      "Generate a new access token using a valid refresh token.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["refreshToken"],
            properties: {
              refreshToken: {
                type: "string",
                example: "eyJhbGciOiJIUzI1NiIs...",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Access token refreshed successfully",
      },
      "401": {
        description: "Invalid or expired refresh token",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
    },
  },
},

"/auth/me": {
  get: {
    tags: ["Authentication"],
    summary: "Get current authenticated user",
    description:
      "Returns the profile information of the currently authenticated user.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    responses: {
      "200": {
        description: "Current user retrieved successfully",
      },
      "401": {
        description: "Authentication required",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
    },
  },
},

"/auth/logout": {
  post: {
    tags: ["Authentication"],
    summary: "Logout current user",
    description:
      "Logs out the currently authenticated user and records the logout activity.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    responses: {
      "200": {
        description: "Logout successful",
      },
      "401": {
        description: "Authentication required",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
    },
  },
},


  },
};