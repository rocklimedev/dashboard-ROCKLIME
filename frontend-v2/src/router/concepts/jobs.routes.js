// src/routes/concepts/jobs.routes.js
import { Icons } from "../icons.config";

import JobList from "../../pages/Jobs/JobsList";
import JobDetails from "../../pages/Jobs/JobDetails";
import BulkProductImport from "../../components/Product/BulkProductImport";

export const jobsRoutes = [
  {
    path: "/jobs/list",
    name: "Jobs",
    icon: Icons.bell,
    element: <JobList />,
  },
  {
    path: "/job/add",
    name: "Bulk Product",
    icon: Icons.cart,
    element: <BulkProductImport />,
  },
  {
    path: "/job/:jobId",
    name: "Job Details",
    icon: Icons.bell,
    element: <JobDetails />,
  },
];