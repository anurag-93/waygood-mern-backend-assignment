const Program = require("../models/Program");
const Student = require("../models/Student");
const HttpError = require("../utils/httpError");

// Build personalized program recommendations using MongoDB
// aggregation instead of calculating recommendation scores
// in application-level JavaScript.

async function buildProgramRecommendations(studentId) {
  const student = await Student.findById(studentId).lean();

  if (!student) {
    throw new HttpError(404, "Student not found.");
  }

  // Initially restrict candidates to the student's preferred countries.
// This reduces the number of documents processed by later stages.

  const candidatePrograms = await Program.aggregate([
    {
      $match: {
        country: {
          $in: student.targetCountries || [],
        },
      },
    },

    {
      // Calculate the recommendation score inside MongoDB.
// Scores are based on country, field, budget, intake, and IELTS fit.
      $set: {
        matchScore: {
          $add: [
            {
              $cond: [
                {
                  $in: ["$country", student.targetCountries || []],
                },
                35,
                0,
              ],
            },

            {
              $cond: [
                {
                  $anyElementTrue: {
                    $map: {
                      input: student.interestedFields || [],
                      as: "fieldPreference",
                      in: {
                        $regexMatch: {
                          input: "$field",
                          regex: "$$fieldPreference",
                          options: "i",
                        },
                      },
                    },
                  },
                },
                30,
                0,
              ],
            },

            {
              $cond: [
                {
                  $gte: [
                    student.maxBudgetUsd || 0,
                    "$tuitionFeeUsd",
                  ],
                },
                20,
                0,
              ],
            },

            {
              $cond: [
                {
                  $and: [
                    {
                      $ne: [
                        student.preferredIntake || "",
                        "",
                      ],
                    },
                    {
                      $in: [
                        student.preferredIntake || "",
                        "$intakes",
                      ],
                    },
                  ],
                },
                10,
                0,
              ],
            },

            {
              $cond: [
                {
                  $gte: [
                    student.englishTest?.score || 0,
                    "$minimumIelts",
                  ],
                },
                5,
                0,
              ],
            },
          ],
        },
      },
    },

    {
      $set: {
        reasons: {
          $concatArrays: [
            {
              $cond: [
                {
                  $in: ["$country", student.targetCountries || []],
                },
                [`Preferred country match`],
                [],
              ],
            },

            {
              $cond: [
                {
                  $anyElementTrue: {
                    $map: {
                      input: student.interestedFields || [],
                      as: "fieldPreference",
                      in: {
                        $regexMatch: {
                          input: "$field",
                          regex: "$$fieldPreference",
                          options: "i",
                        },
                      },
                    },
                  },
                },
                [`Field alignment`],
                [],
              ],
            },

            {
              $cond: [
                {
                  $gte: [
                    student.maxBudgetUsd || 0,
                    "$tuitionFeeUsd",
                  ],
                },
                ["Within budget range"],
                [],
              ],
            },

            {
              $cond: [
                {
                  $and: [
                    {
                      $ne: [
                        student.preferredIntake || "",
                        "",
                      ],
                    },
                    {
                      $in: [
                        student.preferredIntake || "",
                        "$intakes",
                      ],
                    },
                  ],
                },
                ["Preferred intake available"],
                [],
              ],
            },

            {
              $cond: [
                {
                  $gte: [
                    student.englishTest?.score || 0,
                    "$minimumIelts",
                  ],
                },
                ["English test score meets requirement"],
                [],
              ],
            },
          ],
        },
      },
    },

    {
      $sort: {
        matchScore: -1,
        tuitionFeeUsd: 1,
      },
    },
// Return only the top five recommendations.
    {
      $limit: 5,
    },
  ]);
  
// Aggregation has already calculated the score, reasons,
// ordering, and result limit, so no additional JavaScript
// scoring or sorting is required.
  const recommendations = candidatePrograms;

  return {
    data: {
      student: {
        id: student._id,
        fullName: student.fullName,
        targetCountries: student.targetCountries,
        interestedFields: student.interestedFields,
      },
      recommendations,
    },
    meta: {
      implementationStatus: "mongodb-aggregation",
    },
  };
}

module.exports = {
  buildProgramRecommendations,
};
