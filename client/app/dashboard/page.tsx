
import Dashboard from "@/components/Dashboard/E-commerce";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import "@/css/style.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "TÂCHETY",
  description: "Collaborative App",
};


const UserDashboard = () =>  {
  return  (
    <>
      <DefaultLayout>
      <Dashboard />
      </DefaultLayout>
    </>
  );
}
export default UserDashboard;
