import React, { useState } from "react";
import CreateCampaign from "../components/CreateCampaign";

function Home() {
  const [openCreateCampaign, setOpenCreateCampaign] = useState(false);
  return (
    <>
      <div className="pt-[100px]">
        <p className="text-3xl text-white">Welcome to the Home Page!</p>

        {/* action btns */}
        <div>
          <button
            onClick={() => setOpenCreateCampaign(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Campaign
          </button>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {openCreateCampaign && (
        <CreateCampaign onClose={() => setOpenCreateCampaign(false)} />
      )}
    </>
  );
}

export default Home;
