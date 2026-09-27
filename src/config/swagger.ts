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
  },
};