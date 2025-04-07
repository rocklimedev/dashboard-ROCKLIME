import React, { useState, useEffect } from "react";
import logo from "../../assets/img/logo-small.png";
const ComingSoon = () => {
  // Set target date (Change this to your desired launch date)
  const targetDate = new Date("2025-06-01T00:00:00").getTime();

  const calculateTimeLeft = () => {
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        ),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    }
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="main-wrapper">
      <div className="comming-soon-pg w-100">
        <div className="coming-soon-box">
          <div className="pos-logo">
            <img src={logo} alt="Img" />
          </div>
          <span>Our Website is</span>
          <h1>
            <span> COMING </span> SOON
          </h1>
          <p>
            Please check back later, We are working hard to get everything just
            right.
          </p>
          <ul className="coming-soon-timer">
            <li>
              <span className="days">{timeLeft.days}</span>days
            </li>
            <li className="seperate-dot">:</li>
            <li>
              <span className="hours">{timeLeft.hours}</span>Hrs
            </li>
            <li className="seperate-dot">:</li>
            <li>
              <span className="minutes">{timeLeft.minutes}</span>Min
            </li>
            <li className="seperate-dot">:</li>
            <li>
              <span className="seconds">{timeLeft.seconds}</span>Sec
            </li>
          </ul>
          <div className="subscribe-form">
            <div className="mb-3">
              <label className="form-label">Subscribe to get notified!</label>
              <input
                type="email"
                className="form-control"
                placeholder="Enter Your Email"
              />
              <a href="#" className="btn btn-primary subscribe-btn">
                Subscribe
              </a>
            </div>
          </div>
          <ul className="social-media-icons">
            <li>
              <a href="#">
                <i className="fab fa-facebook-f"></i>
              </a>
            </li>
            <li>
              <a href="#">
                <i className="fab fa-instagram"></i>
              </a>
            </li>
            <li>
              <a href="#">
                <i className="fab fa-twitter"></i>
              </a>
            </li>
            <li>
              <a href="#">
                <i className="fab fa-pinterest-p"></i>
              </a>
            </li>
            <li>
              <a href="#">
                <i className="fab fa-linkedin"></i>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
