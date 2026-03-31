import React from "react";
import Layout from "../components/Layout";
import MeterReadingPanel from "../components/MeterReadingPanel";

const MeterReadingPage = () => {
  return (
    <Layout page="meterReading">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <MeterReadingPanel />
      </div>
    </Layout>
  );
};

export default MeterReadingPage;
