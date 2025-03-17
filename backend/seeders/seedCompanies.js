const Company = require("../models/company"); // Import the Company model

const seedCompanies = async () => {
  try {
    console.log(
      "Starting to seed SP SYNDICATE PRIVATE LIMITED as the parent company..."
    );

    // Insert parent company
    const parentCompany = await Company.create({
      companyId: "3dec65cc-3d93-4b12-b060-6e0374f375d9",
      name: "SP SYNDICATE PRIVATE LIMITED",
      address: "123, Main Street, Mumbai, India",
      website: "https://spsyndicate.com",
      createdDate: "2005-07-20",
      slug: "sp-syndicate-private-limited",
      parentCompanyId: null,
    });

    console.log("Parent company seeded successfully.");
    console.log("Parent Company ID:", parentCompany.companyId);

    const childCompanies = [
      {
        companyId: "401df7ef-f350-4bc4-ba6f-bf36923af252",
        name: "CHABBRA MARBEL",
        address: "123, Main Street, Mumbai, India",
        website: "https://cmtradingco.com/",
        createdDate: "2005-07-20",
        slug: "chabbra-marbel",
        parentCompanyId: parentCompany.companyId,
      },
      {
        companyId: "5f87b3a4-6b9b-4208-ad00-e197d5d19763",
        name: "EMBARK ENTERPRISES",
        address: "123, Main Street, Mumbai, India",
        website: "https://sarvesa.in",
        createdDate: "2005-07-20",
        slug: "embark-enterprises",
        parentCompanyId: parentCompany.companyId,
      },
      {
        companyId: "5ffbaa43-2cea-410f-b604-8b6e5558b2e8",
        name: "RIPPOTAI ARCHITECTURE",
        address: "123, Main Street, Mumbai, India",
        website: "https://rippotaiarchitecture.com/",
        createdDate: "2005-07-20",
        slug: "rippotai-architecture",
        parentCompanyId: parentCompany.companyId,
      },
      {
        companyId: "87a5c590-5a81-4893-985e-f19a0ad0b122",
        name: "ROCKLIME",
        address: "123, Main Street, Mumbai, India",
        website: "https://cmtradingco.com/",
        createdDate: "2005-07-20",
        slug: "rocklime",
        parentCompanyId: parentCompany.companyId,
      },
    ];

    console.log("Starting to seed child companies...");
    await Company.bulkCreate(childCompanies);
    console.log("Child companies seeded successfully.");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
};

module.exports = { seedCompanies };
