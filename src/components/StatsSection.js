import React, { memo } from "react";
import Odometer from "./Odometer";

const StatsSection = ({ odometerTrigger }) => {
  return (
    <section className="stats-bar gpu-layer">
      <div className="stat-item">
        <Odometer value="98,087" triggerId={odometerTrigger} />
        <p>MEMBERS</p>
      </div>

      <div className="stat-item">
        <Odometer value="309" triggerId={odometerTrigger} />
        <p>ORGANIZERS</p>
      </div>

      <div className="stat-item">
        <Odometer value="9,350,500" triggerId={odometerTrigger} />
        <p>BOOKINGS</p>
      </div>

      <div className="stat-item">
        <Odometer value="206" triggerId={odometerTrigger} />
        <p>CITIES</p>
      </div>
    </section>
  );
};

export default memo(StatsSection);
