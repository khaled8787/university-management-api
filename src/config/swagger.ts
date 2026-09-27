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

"/departments": {
  get: {
    tags: ["Departments"],
    summary: "Get all departments",
    description:
      "Retrieve a paginated list of active departments. Any authenticated user can access this endpoint.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "page",
        in: "query",
        description: "Page number",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          default: 1,
        },
        example: 1,
      },
      {
        name: "limit",
        in: "query",
        description: "Number of departments per page",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 10,
        },
        example: 10,
      },
      {
        name: "search",
        in: "query",
        description: "Search departments by name or code",
        required: false,
        schema: {
          type: "string",
        },
        example: "Computer",
      },
      {
        name: "sortBy",
        in: "query",
        description: "Field used for sorting",
        required: false,
        schema: {
          type: "string",
          example: "name",
        },
      },
      {
        name: "sortOrder",
        in: "query",
        description: "Sorting direction",
        required: false,
        schema: {
          type: "string",
          enum: ["asc", "desc"],
          default: "asc",
        },
        example: "asc",
      },
    ],
    responses: {
      "200": {
        description: "Departments retrieved successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
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

  post: {
    tags: ["Departments"],
    summary: "Create a department",
    description: "Create a new department. Only ADMIN users can create departments.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name", "code"],
            properties: {
              name: {
                type: "string",
                example: "Computer Science and Engineering",
              },
              code: {
                type: "string",
                example: "CSE",
              },
              description: {
                type: "string",
                example:
                  "Department of Computer Science and Engineering.",
              },
            },
          },
        },
      },
    },
    responses: {
      "201": {
        description: "Department created successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
      },
      "400": {
        description: "Invalid department data or duplicate department",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
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
      "403": {
        description: "Only ADMIN users can create departments",
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

"/departments/{id}": {
  get: {
    tags: ["Departments"],
    summary: "Get department by ID",
    description:
      "Retrieve a single active department by its ID. Any authenticated user can access this endpoint.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Department ID",
        schema: {
          type: "string",
        },
        example: "clx123department456",
      },
    ],
    responses: {
      "200": {
        description: "Department retrieved successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
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
      "404": {
        description: "Department not found",
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

  patch: {
    tags: ["Departments"],
    summary: "Update a department",
    description: "Update an existing department. Only ADMIN users can update departments.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Department ID",
        schema: {
          type: "string",
        },
        example: "clx123department456",
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                example: "Computer Science and Engineering",
              },
              code: {
                type: "string",
                example: "CSE",
              },
              description: {
                type: "string",
                example:
                  "Updated department description.",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Department updated successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
      },
      "400": {
        description: "Invalid update data or duplicate department",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
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
      "403": {
        description: "Only ADMIN users can update departments",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      "404": {
        description: "Department not found",
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

  delete: {
    tags: ["Departments"],
    summary: "Soft delete a department",
    description:
      "Soft delete an existing department. The department is not physically removed from the database. Only ADMIN users can perform this operation.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Department ID",
        schema: {
          type: "string",
        },
        example: "clx123department456",
      },
    ],
    responses: {
      "200": {
        description: "Department soft deleted successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
      },
      "400": {
        description:
          "Department cannot be deleted because it is referenced by other records",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
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
      "403": {
        description: "Only ADMIN users can delete departments",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      "404": {
        description: "Department not found",
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

"/students": {
  get: {
    tags: ["Students"],
    summary: "Get all students",
    description:
      "Retrieve a paginated list of students. Only ADMIN users can access this endpoint.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "page",
        in: "query",
        required: false,
        description: "Page number",
        schema: {
          type: "integer",
          minimum: 1,
          default: 1,
        },
        example: 1,
      },
      {
        name: "limit",
        in: "query",
        required: false,
        description: "Number of students per page",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 10,
        },
        example: 10,
      },
      {
        name: "search",
        in: "query",
        required: false,
        description:
          "Search students by name, email, student ID or other supported fields",
        schema: {
          type: "string",
        },
        example: "Khaled",
      },
      {
        name: "sortBy",
        in: "query",
        required: false,
        description: "Field used for sorting",
        schema: {
          type: "string",
        },
        example: "createdAt",
      },
      {
        name: "sortOrder",
        in: "query",
        required: false,
        description: "Sorting direction",
        schema: {
          type: "string",
          enum: ["asc", "desc"],
          default: "desc",
        },
        example: "desc",
      },
    ],
    responses: {
      "200": {
        description: "Students retrieved successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
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
      "403": {
        description: "Only ADMIN users can view students",
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

"/students/{id}": {
  get: {
    tags: ["Students"],
    summary: "Get student by ID",
    description:
      "Retrieve a specific student by ID. Only ADMIN users can access this endpoint.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Student ID",
        schema: {
          type: "string",
        },
        example: "clx123student456",
      },
    ],
    responses: {
      "200": {
        description: "Student retrieved successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
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
      "403": {
        description: "Only ADMIN users can view a student",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      "404": {
        description: "Student not found",
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

  patch: {
    tags: ["Students"],
    summary: "Update student profile",
    description:
      "Update an existing student's profile. Only ADMIN users can update student information.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Student ID",
        schema: {
          type: "string",
        },
        example: "clx123student456",
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                example: "Khaled Mahmud",
              },
              phone: {
                type: "string",
                example: "+8801700000000",
              },
              address: {
                type: "string",
                example: "Natore, Bangladesh",
              },
              dateOfBirth: {
                type: "string",
                format: "date",
                example: "2002-05-15",
              },
              departmentId: {
                type: "string",
                example: "clx123department456",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Student updated successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
      },
      "400": {
        description: "Invalid student update data",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
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
      "403": {
        description: "Only ADMIN users can update students",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      "404": {
        description: "Student not found",
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

  delete: {
    tags: ["Students"],
    summary: "Soft delete a student",
    description:
      "Soft delete a student instead of permanently removing the record from the database. Only ADMIN users can perform this operation.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Student ID",
        schema: {
          type: "string",
        },
        example: "clx123student456",
      },
    ],
    responses: {
      "200": {
        description: "Student soft deleted successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
      },
      "400": {
        description:
          "Student cannot be deleted because of related academic records or business rules",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
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
      "403": {
        description: "Only ADMIN users can delete students",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      "404": {
        description: "Student not found",
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


"/faculties": {
  get: {
    tags: ["Faculties"],
    summary: "Get all faculties",
    description:
      "Retrieve a paginated list of faculties. Only ADMIN users can access this endpoint.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "page",
        in: "query",
        required: false,
        description: "Page number",
        schema: {
          type: "integer",
          minimum: 1,
          default: 1,
        },
        example: 1,
      },
      {
        name: "limit",
        in: "query",
        required: false,
        description: "Number of faculty records per page",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 10,
        },
        example: 10,
      },
      {
        name: "search",
        in: "query",
        required: false,
        description:
          "Search faculties by name, email, employee ID or other supported fields",
        schema: {
          type: "string",
        },
        example: "Rahman",
      },
      {
        name: "departmentId",
        in: "query",
        required: false,
        description: "Filter faculties by department ID",
        schema: {
          type: "string",
        },
        example: "clx123department456",
      },
      {
        name: "sortBy",
        in: "query",
        required: false,
        description: "Field used for sorting",
        schema: {
          type: "string",
        },
        example: "createdAt",
      },
      {
        name: "sortOrder",
        in: "query",
        required: false,
        description: "Sorting direction",
        schema: {
          type: "string",
          enum: ["asc", "desc"],
          default: "desc",
        },
        example: "desc",
      },
    ],
    responses: {
      "200": {
        description: "Faculties retrieved successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
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
      "403": {
        description: "Only ADMIN users can view faculties",
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

"/faculties/{id}": {
  get: {
    tags: ["Faculties"],
    summary: "Get faculty by ID",
    description:
      "Retrieve a specific faculty member by ID. Only ADMIN users can access this endpoint.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Faculty ID",
        schema: {
          type: "string",
        },
        example: "clx123faculty456",
      },
    ],
    responses: {
      "200": {
        description: "Faculty retrieved successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
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
      "403": {
        description: "Only ADMIN users can view a faculty",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      "404": {
        description: "Faculty not found",
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

  patch: {
    tags: ["Faculties"],
    summary: "Update faculty profile",
    description:
      "Update an existing faculty member's profile. Only ADMIN users can update faculty information.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Faculty ID",
        schema: {
          type: "string",
        },
        example: "clx123faculty456",
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                example: "Dr. Abdul Rahman",
              },
              phone: {
                type: "string",
                example: "+8801700000000",
              },
              address: {
                type: "string",
                example: "Rajshahi, Bangladesh",
              },
              designation: {
                type: "string",
                example: "Associate Professor",
              },
              departmentId: {
                type: "string",
                example: "clx123department456",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Faculty updated successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
      },
      "400": {
        description: "Invalid faculty update data",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
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
      "403": {
        description: "Only ADMIN users can update faculties",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      "404": {
        description: "Faculty not found",
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

  delete: {
    tags: ["Faculties"],
    summary: "Soft delete a faculty",
    description:
      "Soft delete a faculty member instead of permanently removing the database record. Only ADMIN users can perform this operation.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Faculty ID",
        schema: {
          type: "string",
        },
        example: "clx123faculty456",
      },
    ],
    responses: {
      "200": {
        description: "Faculty soft deleted successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
      },
      "400": {
        description:
          "Faculty cannot be deleted because of related records or business rules",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
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
      "403": {
        description: "Only ADMIN users can delete faculties",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      "404": {
        description: "Faculty not found",
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


"/courses": {
  get: {
    tags: ["Courses"],
    summary: "Get all courses",
    description:
      "Retrieve a paginated and filterable list of courses. ADMIN, FACULTY and STUDENT users can access this endpoint.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "page",
        in: "query",
        required: false,
        description: "Page number",
        schema: {
          type: "integer",
          minimum: 1,
          default: 1,
        },
        example: 1,
      },
      {
        name: "limit",
        in: "query",
        required: false,
        description: "Number of courses per page",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 10,
        },
        example: 10,
      },
      {
        name: "search",
        in: "query",
        required: false,
        description: "Search courses by title, code or other supported fields",
        schema: {
          type: "string",
        },
        example: "Database",
      },
      {
        name: "departmentId",
        in: "query",
        required: false,
        description: "Filter courses by department ID",
        schema: {
          type: "string",
        },
        example: "clx123department456",
      },
      {
        name: "facultyId",
        in: "query",
        required: false,
        description: "Filter courses by faculty ID",
        schema: {
          type: "string",
        },
        example: "clx123faculty456",
      },
      {
        name: "isActive",
        in: "query",
        required: false,
        description: "Filter courses by active status",
        schema: {
          type: "boolean",
        },
        example: true,
      },
      {
        name: "sortBy",
        in: "query",
        required: false,
        description: "Field used for sorting",
        schema: {
          type: "string",
        },
        example: "createdAt",
      },
      {
        name: "sortOrder",
        in: "query",
        required: false,
        description: "Sorting direction",
        schema: {
          type: "string",
          enum: ["asc", "desc"],
          default: "desc",
        },
        example: "desc",
      },
    ],
    responses: {
      "200": {
        description: "Courses retrieved successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
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
      "403": {
        description:
          "User role is not allowed to access course listing",
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

  post: {
    tags: ["Courses"],
    summary: "Create a course",
    description:
      "Create a new course. Only ADMIN users can create courses.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: [
              "code",
              "title",
              "credit",
              "departmentId",
            ],
            properties: {
              code: {
                type: "string",
                example: "CSE-101",
              },
              title: {
                type: "string",
                example: "Introduction to Computer Science",
              },
              description: {
                type: "string",
                example:
                  "Fundamental concepts of computer science and programming.",
              },
              credit: {
                type: "number",
                format: "float",
                example: 3,
              },
              capacity: {
                type: "integer",
                example: 40,
              },
              departmentId: {
                type: "string",
                example: "clx123department456",
              },
              facultyId: {
                type: "string",
                nullable: true,
                example: "clx123faculty456",
              },
              isActive: {
                type: "boolean",
                default: true,
                example: true,
              },
            },
          },
        },
      },
    },
    responses: {
      "201": {
        description: "Course created successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
      },
      "400": {
        description:
          "Invalid course data, duplicate course code, or invalid academic relation",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
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
      "403": {
        description: "Only ADMIN users can create courses",
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

"/courses/{id}": {
  get: {
    tags: ["Courses"],
    summary: "Get course by ID",
    description:
      "Retrieve a specific active course by ID. ADMIN, FACULTY and STUDENT users can access this endpoint.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Course ID",
        schema: {
          type: "string",
        },
        example: "clx123course456",
      },
    ],
    responses: {
      "200": {
        description: "Course retrieved successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
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
      "403": {
        description: "User role is not allowed to access this course",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      "404": {
        description: "Course not found",
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

  patch: {
    tags: ["Courses"],
    summary: "Update a course",
    description:
      "Update an existing course. Only ADMIN users can update courses.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Course ID",
        schema: {
          type: "string",
        },
        example: "clx123course456",
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              code: {
                type: "string",
                example: "CSE-101",
              },
              title: {
                type: "string",
                example: "Advanced Introduction to Computer Science",
              },
              description: {
                type: "string",
                example:
                  "Updated course description.",
              },
              credit: {
                type: "number",
                format: "float",
                example: 3,
              },
              capacity: {
                type: "integer",
                example: 50,
              },
              departmentId: {
                type: "string",
                example: "clx123department456",
              },
              facultyId: {
                type: "string",
                nullable: true,
                example: "clx123faculty456",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Course updated successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
      },
      "400": {
        description:
          "Invalid course data, duplicate course code, invalid relation, or capacity constraint",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
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
      "403": {
        description: "Only ADMIN users can update courses",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      "404": {
        description: "Course not found",
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

  delete: {
    tags: ["Courses"],
    summary: "Soft delete a course",
    description:
      "Soft delete a course instead of physically removing it from the database. Only ADMIN users can perform this operation.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Course ID",
        schema: {
          type: "string",
        },
        example: "clx123course456",
      },
    ],
    responses: {
      "200": {
        description: "Course soft deleted successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
      },
      "400": {
        description:
          "Course cannot be deleted because it has related academic records",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
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
      "403": {
        description: "Only ADMIN users can delete courses",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      "404": {
        description: "Course not found",
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

"/courses/{id}/status": {
  patch: {
    tags: ["Courses"],
    summary: "Activate or deactivate a course",
    description:
      "Change the active status of a course. Only ADMIN users can activate or deactivate courses.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Course ID",
        schema: {
          type: "string",
        },
        example: "clx123course456",
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["isActive"],
            properties: {
              isActive: {
                type: "boolean",
                example: true,
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Course status updated successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
      },
      "400": {
        description: "Invalid course status data",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
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
      "403": {
        description: "Only ADMIN users can change course status",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      "404": {
        description: "Course not found",
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


"/enrollments": {
  post: {
    tags: ["Enrollments"],
    summary: "Create an enrollment request",
    description:
      "Create a new course enrollment request. Only STUDENT users can create enrollment requests.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["courseId"],
            properties: {
              courseId: {
                type: "string",
                description: "Course ID for enrollment",
                example: "clx123course456",
              },
            },
          },
        },
      },
    },
    responses: {
      "201": {
        description: "Enrollment request created successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
      },
      "400": {
        description:
          "Invalid enrollment request or enrollment business rule violation",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
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
      "403": {
        description: "Only STUDENT users can create enrollments",
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

  get: {
    tags: ["Enrollments"],
    summary: "Get all enrollments",
    description:
      "Retrieve all enrollment records with pagination, filtering and sorting. Only ADMIN users can access this endpoint.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "page",
        in: "query",
        required: false,
        description: "Page number",
        schema: {
          type: "integer",
          minimum: 1,
          default: 1,
        },
        example: 1,
      },
      {
        name: "limit",
        in: "query",
        required: false,
        description: "Number of enrollments per page",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 10,
        },
        example: 10,
      },
      {
        name: "search",
        in: "query",
        required: false,
        description: "Search enrollment records",
        schema: {
          type: "string",
        },
        example: "CSE-101",
      },
      {
        name: "status",
        in: "query",
        required: false,
        description: "Filter enrollments by status",
        schema: {
          type: "string",
          example: "PENDING",
        },
        example: "PENDING",
      },
      {
        name: "studentId",
        in: "query",
        required: false,
        description: "Filter enrollments by student ID",
        schema: {
          type: "string",
        },
        example: "clx123student456",
      },
      {
        name: "courseId",
        in: "query",
        required: false,
        description: "Filter enrollments by course ID",
        schema: {
          type: "string",
        },
        example: "clx123course456",
      },
      {
        name: "sortBy",
        in: "query",
        required: false,
        description: "Field used for sorting",
        schema: {
          type: "string",
        },
        example: "createdAt",
      },
      {
        name: "sortOrder",
        in: "query",
        required: false,
        description: "Sorting direction",
        schema: {
          type: "string",
          enum: ["asc", "desc"],
          default: "desc",
        },
        example: "desc",
      },
    ],
    responses: {
      "200": {
        description: "Enrollments retrieved successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
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
      "403": {
        description: "Only ADMIN users can view all enrollments",
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

"/enrollments/my": {
  get: {
    tags: ["Enrollments"],
    summary: "Get my enrollments",
    description:
      "Retrieve the authenticated student's own enrollment records. Only STUDENT users can access this endpoint.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "page",
        in: "query",
        required: false,
        description: "Page number",
        schema: {
          type: "integer",
          minimum: 1,
          default: 1,
        },
        example: 1,
      },
      {
        name: "limit",
        in: "query",
        required: false,
        description: "Number of enrollments per page",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 10,
        },
        example: 10,
      },
      {
        name: "status",
        in: "query",
        required: false,
        description: "Filter own enrollments by status",
        schema: {
          type: "string",
        },
        example: "APPROVED",
      },
    ],
    responses: {
      "200": {
        description: "Student enrollments retrieved successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
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
      "403": {
        description: "Only STUDENT users can view their enrollments",
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

"/enrollments/{id}": {
  get: {
    tags: ["Enrollments"],
    summary: "Get enrollment by ID",
    description:
      "Retrieve a specific enrollment. ADMIN, FACULTY and STUDENT users can access this endpoint according to the application's authorization rules.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Enrollment ID",
        schema: {
          type: "string",
        },
        example: "clx123enrollment456",
      },
    ],
    responses: {
      "200": {
        description: "Enrollment retrieved successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
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
      "403": {
        description: "User role is not allowed to access this enrollment",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      "404": {
        description: "Enrollment not found",
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

"/enrollments/{id}/cancel": {
  patch: {
    tags: ["Enrollments"],
    summary: "Cancel my enrollment",
    description:
      "Cancel the authenticated student's own pending enrollment request. Only STUDENT users can perform this operation.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Enrollment ID",
        schema: {
          type: "string",
        },
        example: "clx123enrollment456",
      },
    ],
    responses: {
      "200": {
        description: "Enrollment cancelled successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
      },
      "400": {
        description:
          "Enrollment cannot be cancelled because it is not pending or violates a business rule",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
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
      "403": {
        description: "Only STUDENT users can cancel enrollments",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      "404": {
        description: "Enrollment not found",
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

"/enrollments/{id}/status": {
  patch: {
    tags: ["Enrollments"],
    summary: "Approve or reject an enrollment",
    description:
      "Update the status of an enrollment request. Only ADMIN users can approve or reject enrollment requests.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Enrollment ID",
        schema: {
          type: "string",
        },
        example: "clx123enrollment456",
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["status"],
            properties: {
              status: {
                type: "string",
                description: "New enrollment status",
                example: "APPROVED",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Enrollment status updated successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
      },
      "400": {
        description:
          "Invalid enrollment status or enrollment cannot be updated",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
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
      "403": {
        description: "Only ADMIN users can approve or reject enrollments",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      "404": {
        description: "Enrollment not found",
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


"/attendances": {
  get: {
    tags: ["Attendance"],
    summary: "Get all attendance records",
    description:
      "Retrieve all attendance records with pagination and filtering. Only ADMIN users can access this endpoint.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "page",
        in: "query",
        required: false,
        description: "Page number",
        schema: {
          type: "integer",
          minimum: 1,
          default: 1,
        },
        example: 1,
      },
      {
        name: "limit",
        in: "query",
        required: false,
        description: "Number of attendance records per page",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 10,
        },
        example: 10,
      },
      {
        name: "studentId",
        in: "query",
        required: false,
        description: "Filter attendance by student ID",
        schema: {
          type: "string",
        },
        example: "clx123student456",
      },
      {
        name: "courseId",
        in: "query",
        required: false,
        description: "Filter attendance by course ID",
        schema: {
          type: "string",
        },
        example: "clx123course456",
      },
      {
        name: "date",
        in: "query",
        required: false,
        description: "Filter attendance by date",
        schema: {
          type: "string",
          format: "date",
        },
        example: "2026-09-28",
      },
      {
        name: "status",
        in: "query",
        required: false,
        description: "Filter attendance by attendance status",
        schema: {
          type: "string",
        },
        example: "PRESENT",
      },
      {
        name: "sortBy",
        in: "query",
        required: false,
        description: "Field used for sorting",
        schema: {
          type: "string",
        },
        example: "createdAt",
      },
      {
        name: "sortOrder",
        in: "query",
        required: false,
        description: "Sorting direction",
        schema: {
          type: "string",
          enum: ["asc", "desc"],
          default: "desc",
        },
        example: "desc",
      },
    ],
    responses: {
      "200": {
        description: "Attendance records retrieved successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
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
      "403": {
        description: "Only ADMIN users can view all attendance records",
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

  post: {
    tags: ["Attendance"],
    summary: "Create an attendance record",
    description:
      "Create an attendance record for a student in a course. ADMIN and FACULTY users can create attendance records.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: [
              "studentId",
              "courseId",
              "date",
              "status",
            ],
            properties: {
              studentId: {
                type: "string",
                example: "clx123student456",
              },
              courseId: {
                type: "string",
                example: "clx123course456",
              },
              date: {
                type: "string",
                format: "date",
                example: "2026-09-28",
              },
              status: {
                type: "string",
                example: "PRESENT",
              },
              remarks: {
                type: "string",
                example: "Student attended the class.",
              },
            },
          },
        },
      },
    },
    responses: {
      "201": {
        description: "Attendance record created successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
      },
      "400": {
        description:
          "Invalid attendance data or duplicate attendance record",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
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
      "403": {
        description:
          "Only ADMIN or FACULTY users can create attendance",
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

"/attendances/my": {
  get: {
    tags: ["Attendance"],
    summary: "Get my attendance records",
    description:
      "Retrieve attendance records belonging to the authenticated student. Only STUDENT users can access this endpoint.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "page",
        in: "query",
        required: false,
        description: "Page number",
        schema: {
          type: "integer",
          minimum: 1,
          default: 1,
        },
        example: 1,
      },
      {
        name: "limit",
        in: "query",
        required: false,
        description: "Number of records per page",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 10,
        },
        example: 10,
      },
      {
        name: "courseId",
        in: "query",
        required: false,
        description: "Filter own attendance by course ID",
        schema: {
          type: "string",
        },
        example: "clx123course456",
      },
      {
        name: "status",
        in: "query",
        required: false,
        description: "Filter own attendance by status",
        schema: {
          type: "string",
        },
        example: "PRESENT",
      },
    ],
    responses: {
      "200": {
        description: "Student attendance retrieved successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
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
      "403": {
        description: "Only STUDENT users can access their attendance",
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

"/attendances/{id}": {
  get: {
    tags: ["Attendance"],
    summary: "Get attendance record by ID",
    description:
      "Retrieve a single attendance record. ADMIN, FACULTY and STUDENT users can access this endpoint according to application authorization rules.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Attendance record ID",
        schema: {
          type: "string",
        },
        example: "clx123attendance456",
      },
    ],
    responses: {
      "200": {
        description: "Attendance record retrieved successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
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
      "403": {
        description:
          "User role is not allowed to view this attendance record",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      "404": {
        description: "Attendance record not found",
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

  patch: {
    tags: ["Attendance"],
    summary: "Update an attendance record",
    description:
      "Update an existing attendance record. Only ADMIN and FACULTY users can update attendance.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Attendance record ID",
        schema: {
          type: "string",
        },
        example: "clx123attendance456",
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              date: {
                type: "string",
                format: "date",
                example: "2026-09-28",
              },
              status: {
                type: "string",
                example: "ABSENT",
              },
              remarks: {
                type: "string",
                example: "Updated attendance status.",
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Attendance updated successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
      },
      "400": {
        description: "Invalid attendance update data",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
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
      "403": {
        description:
          "Only ADMIN or FACULTY users can update attendance",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      "404": {
        description: "Attendance record not found",
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

  delete: {
    tags: ["Attendance"],
    summary: "Soft delete an attendance record",
    description:
      "Soft delete an attendance record instead of physically removing it from the database. Only ADMIN and FACULTY users can perform this operation.",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Attendance record ID",
        schema: {
          type: "string",
        },
        example: "clx123attendance456",
      },
    ],
    responses: {
      "200": {
        description: "Attendance record soft deleted successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
      },
      "400": {
        description:
          "Attendance record cannot be deleted because of a business rule",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
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
      "403": {
        description:
          "Only ADMIN or FACULTY users can delete attendance",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      "404": {
        description: "Attendance record not found",
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

// =========================
// Results
// =========================

swaggerSpec.paths["/results"] = {
  get: {
    tags: ["Results"],
    summary: "Get all results",
    description:
      "Returns a paginated list of all student results. Only ADMIN users can access this endpoint.",
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: "page",
        in: "query",
        description: "Page number",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          default: 1,
        },
      },
      {
        name: "limit",
        in: "query",
        description: "Number of results per page",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 10,
        },
      },
      {
        name: "search",
        in: "query",
        description: "Search results",
        required: false,
        schema: {
          type: "string",
        },
      },
      {
        name: "studentId",
        in: "query",
        description: "Filter results by student ID",
        required: false,
        schema: {
          type: "string",
        },
      },
      {
        name: "courseId",
        in: "query",
        description: "Filter results by course ID",
        required: false,
        schema: {
          type: "string",
        },
      },
      {
        name: "sortBy",
        in: "query",
        description: "Field used for sorting",
        required: false,
        schema: {
          type: "string",
        },
      },
      {
        name: "sortOrder",
        in: "query",
        description: "Sorting direction",
        required: false,
        schema: {
          type: "string",
          enum: ["asc", "desc"],
          default: "desc",
        },
      },
    ],
    responses: {
      "200": {
        description: "Results retrieved successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
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
      "403": {
        description: "Only ADMIN users can access this endpoint",
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

  post: {
    tags: ["Results"],
    summary: "Create a result",
    description:
      "Creates a new student result. ADMIN and FACULTY users can create results.",
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["studentId", "courseId", "marks"],
            properties: {
              studentId: {
                type: "string",
                description: "Student ID",
                example: "clstudent123",
              },
              courseId: {
                type: "string",
                description: "Course ID",
                example: "clcourse123",
              },
              marks: {
                type: "number",
                description: "Obtained marks",
                minimum: 0,
                maximum: 100,
                example: 85,
              },
              grade: {
                type: "string",
                description: "Grade",
                example: "A+",
              },
              gradePoint: {
                type: "number",
                description: "Grade point",
                example: 4,
              },
            },
          },
        },
      },
    },
    responses: {
      "201": {
        description: "Result created successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
      },
      "400": {
        description: "Invalid result data or business rule violation",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
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
      "403": {
        description: "Only ADMIN or FACULTY users can create results",
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
};

swaggerSpec.paths["/results/my"] = {
  get: {
    tags: ["Results"],
    summary: "Get my results",
    description:
      "Returns the authenticated student's own academic results.",
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: "page",
        in: "query",
        description: "Page number",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          default: 1,
        },
      },
      {
        name: "limit",
        in: "query",
        description: "Number of results per page",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 10,
        },
      },
      {
        name: "courseId",
        in: "query",
        description: "Filter results by course ID",
        required: false,
        schema: {
          type: "string",
        },
      },
      {
        name: "sortOrder",
        in: "query",
        description: "Sorting direction",
        required: false,
        schema: {
          type: "string",
          enum: ["asc", "desc"],
          default: "desc",
        },
      },
    ],
    responses: {
      "200": {
        description: "Student results retrieved successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
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
      "403": {
        description: "Only STUDENT users can access their own results",
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
};

swaggerSpec.paths["/results/{id}"] = {
  get: {
    tags: ["Results"],
    summary: "Get a single result",
    description:
      "Returns details of a specific result. ADMIN, FACULTY and STUDENT users can access this endpoint according to authorization rules.",
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Result ID",
        schema: {
          type: "string",
        },
      },
    ],
    responses: {
      "200": {
        description: "Result retrieved successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
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
      "403": {
        description: "User is not authorized to view this result",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      "404": {
        description: "Result not found",
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

  patch: {
    tags: ["Results"],
    summary: "Update a result",
    description:
      "Updates an existing result. Only ADMIN and FACULTY users can update results.",
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Result ID",
        schema: {
          type: "string",
        },
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              marks: {
                type: "number",
                description: "Updated obtained marks",
                minimum: 0,
                maximum: 100,
                example: 90,
              },
              grade: {
                type: "string",
                description: "Updated grade",
                example: "A+",
              },
              gradePoint: {
                type: "number",
                description: "Updated grade point",
                example: 4,
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Result updated successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
      },
      "400": {
        description: "Invalid update data",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
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
      "403": {
        description: "Only ADMIN or FACULTY users can update results",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      "404": {
        description: "Result not found",
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

  delete: {
    tags: ["Results"],
    summary: "Delete a result",
    description:
      "Soft deletes an existing result. Only ADMIN and FACULTY users can delete results.",
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Result ID",
        schema: {
          type: "string",
        },
      },
    ],
    responses: {
      "200": {
        description: "Result deleted successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
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
      "403": {
        description: "Only ADMIN or FACULTY users can delete results",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      "404": {
        description: "Result not found",
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
};


swaggerSpec.paths["/payments"] = {
  post: {
    tags: ["Payments"],
    summary: "Create a payment",
    description:
      "Creates a new payment record for the authenticated student.",
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["amount"],
            properties: {
              amount: {
                type: "number",
                minimum: 0,
                description: "Payment amount",
                example: 1500,
              },
              currency: {
                type: "string",
                description: "Payment currency",
                example: "usd",
              },
              description: {
                type: "string",
                description: "Payment description",
                example: "Semester tuition fee",
              },
            },
          },
        },
      },
    },
    responses: {
      "201": {
        description: "Payment created successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
      },
      "400": {
        description: "Invalid payment data",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
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
      "403": {
        description: "Only STUDENT users can create payments",
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

  get: {
    tags: ["Payments"],
    summary: "Get all payments",
    description:
      "Returns all payments with pagination and filtering. Only ADMIN users can access this endpoint.",
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: "page",
        in: "query",
        required: false,
        description: "Page number",
        schema: {
          type: "integer",
          minimum: 1,
          default: 1,
        },
      },
      {
        name: "limit",
        in: "query",
        required: false,
        description: "Number of payments per page",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 10,
        },
      },
      {
        name: "status",
        in: "query",
        required: false,
        description: "Filter payments by status",
        schema: {
          type: "string",
        },
      },
      {
        name: "studentId",
        in: "query",
        required: false,
        description: "Filter payments by student ID",
        schema: {
          type: "string",
        },
      },
      {
        name: "search",
        in: "query",
        required: false,
        description: "Search payments",
        schema: {
          type: "string",
        },
      },
      {
        name: "sortBy",
        in: "query",
        required: false,
        description: "Field used for sorting",
        schema: {
          type: "string",
        },
      },
      {
        name: "sortOrder",
        in: "query",
        required: false,
        description: "Sorting direction",
        schema: {
          type: "string",
          enum: ["asc", "desc"],
          default: "desc",
        },
      },
    ],
    responses: {
      "200": {
        description: "Payments retrieved successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
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
      "403": {
        description: "Only ADMIN users can access all payments",
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
};

swaggerSpec.paths["/payments/my"] = {
  get: {
    tags: ["Payments"],
    summary: "Get my payments",
    description:
      "Returns all payments belonging to the authenticated student.",
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: "page",
        in: "query",
        required: false,
        description: "Page number",
        schema: {
          type: "integer",
          minimum: 1,
          default: 1,
        },
      },
      {
        name: "limit",
        in: "query",
        required: false,
        description: "Number of payments per page",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 10,
        },
      },
      {
        name: "status",
        in: "query",
        required: false,
        description: "Filter by payment status",
        schema: {
          type: "string",
        },
      },
      {
        name: "sortOrder",
        in: "query",
        required: false,
        description: "Sorting direction",
        schema: {
          type: "string",
          enum: ["asc", "desc"],
          default: "desc",
        },
      },
    ],
    responses: {
      "200": {
        description: "Student payments retrieved successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
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
      "403": {
        description: "Only STUDENT users can access their payments",
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
};

swaggerSpec.paths["/payments/my/{id}"] = {
  get: {
    tags: ["Payments"],
    summary: "Get my payment by ID",
    description:
      "Returns a specific payment belonging to the authenticated student.",
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Payment ID",
        schema: {
          type: "string",
        },
      },
    ],
    responses: {
      "200": {
        description: "Payment retrieved successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
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
      "403": {
        description: "Only STUDENT users can access this payment",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      "404": {
        description: "Payment not found",
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
};

swaggerSpec.paths["/payments/{id}/stripe-checkout"] = {
  post: {
    tags: ["Payments"],
    summary: "Create Stripe checkout session",
    description:
      "Creates a Stripe Checkout Session for the authenticated student's payment.",
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Payment ID",
        schema: {
          type: "string",
        },
      },
    ],
    responses: {
      "200": {
        description: "Stripe checkout session created successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
      },
      "400": {
        description: "Unable to create Stripe checkout session",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
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
      "403": {
        description: "Only STUDENT users can create checkout sessions",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      "404": {
        description: "Payment not found",
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
};

swaggerSpec.paths["/payments/{id}/cancel"] = {
  patch: {
    tags: ["Payments"],
    summary: "Cancel a payment",
    description:
      "Cancels a payment belonging to the authenticated student.",
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Payment ID",
        schema: {
          type: "string",
        },
      },
    ],
    responses: {
      "200": {
        description: "Payment cancelled successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
      },
      "400": {
        description: "Payment cannot be cancelled",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
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
      "403": {
        description: "Only STUDENT users can cancel payments",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      "404": {
        description: "Payment not found",
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
};

swaggerSpec.paths["/payments/admin/{id}"] = {
  get: {
    tags: ["Payments"],
    summary: "Get payment by ID as admin",
    description:
      "Returns detailed information about a specific payment. Only ADMIN users can access this endpoint.",
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Payment ID",
        schema: {
          type: "string",
        },
      },
    ],
    responses: {
      "200": {
        description: "Payment retrieved successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
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
      "403": {
        description: "Only ADMIN users can access this endpoint",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      "404": {
        description: "Payment not found",
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
};

swaggerSpec.paths["/payments/stripe/webhook"] = {
  post: {
    tags: ["Payments"],
    summary: "Stripe webhook",
    description:
      "Receives Stripe webhook events and updates the payment status based on Stripe events. This endpoint is called directly by Stripe and does not require Bearer authentication.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            description: "Stripe webhook event payload",
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Webhook event processed successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
      },
      "400": {
        description: "Invalid Stripe webhook payload or signature",
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
};