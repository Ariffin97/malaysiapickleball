import React from "react";
import "./Organization.css";

const people = {
  president: {
    name: "Puan Delima Ibrahim",
    role: "Acting President",
  },
  deputy: {
    name: "Michael Robin Jayesuria",
    role: "Acting Deputy",
  },
  vp: {
    name: "Hameet",
    role: "Vice President",
  },
  treasurer: {
    name: "Puan Delima Ibrahim",
    role: "Treasurer",
  },
  secretary: {
    name: "Mdm Sally Jong Siew Nyuk",
    role: "Secretary",
  },
  development: {
    name: "Associate Prof. Dr. Mohamad Rahizam",
    role: "Development Chairman",
  },
  tournament: {
    name: "Puan Delima Ibrahim",
    role: "Tournament Chairwoman",
  },
  disciplinary: {
    name: "Jenny Ting Hua Hung",
    role: "Disciplinary Chairwoman",
  },
  advisors: [
    { name: "YB. Kelvin Yii Lee Wuan", role: "Advisor" },
    { name: "YB. Datuk Sabastian Ting", role: "Advisor" },
    { name: "Mr. Farell Choo", role: "Advisor" },
  ],
  subcommittee: [
    { name: "Mohammad @ Razali bin Ibrahim", role: "Sub-Committee Member" },
    { name: "Choong Wai Li", role: "Sub-Committee Member" },
    { name: "Benjamin", role: "Sub-Committee Member" },
    { name: "Mr Thor Meng Tatt", role: "Sub-Committee Member" },
  ],
};

function OrgCard({ name, role, type = "default" }) {
  return (
    <div className={`org-card ${type}`}>
      <div className="card-role">{role}</div>
      <div className="card-name">{name}</div>
    </div>
  );
}

export default function Organization() {
  return (
    <div className="organization-page">
      <div className="org-container">
        {/* Header */}
        <div className="org-header">
          <h1>Current Organization Chart</h1>
          <div className="org-badge">Malaysia Pickleball Association</div>
        </div>

        {/* Organization Chart */}
        <div className="org-chart">
          {/* Top Level - President with Advisors */}
          <div className="top-level">
            <div className="advisors-left">
              <OrgCard
                name={people.advisors[0].name}
                role={people.advisors[0].role}
                type="advisor"
              />
            </div>

            <div className="president-section">
              <OrgCard
                name={people.president.name}
                role={people.president.role}
                type="president"
              />
            </div>

            <div className="advisors-right">
              <OrgCard
                name={people.advisors[1].name}
                role={people.advisors[1].role}
                type="advisor"
              />
              <OrgCard
                name={people.advisors[2].name}
                role={people.advisors[2].role}
                type="advisor"
              />
            </div>
          </div>

          {/* Connector */}
          <div className="level-connector">
            <div className="connector-line"></div>
          </div>

          {/* Acting Deputy Level */}
          <div className="single-position">
            <OrgCard
              name={people.deputy.name}
              role={people.deputy.role}
              type="executive"
            />
          </div>

          {/* Connector */}
          <div className="level-connector">
            <div className="connector-line"></div>
          </div>

          {/* Vice President Level */}
          <div className="single-position">
            <OrgCard
              name={people.vp.name}
              role={people.vp.role}
              type="executive"
            />
          </div>

          {/* Connector */}
          <div className="level-connector">
            <div className="connector-line"></div>
          </div>

          {/* Treasurer and Secretary Level */}
          <div>
            <div className="section-title">Treasury & Administration</div>
            <div className="dual-position">
              <OrgCard
                name={people.treasurer.name}
                role={people.treasurer.role}
                type="executive"
              />
              <OrgCard
                name={people.secretary.name}
                role={people.secretary.role}
                type="executive"
              />
            </div>
          </div>

          {/* Connector */}
          <div className="level-connector">
            <div className="connector-line"></div>
          </div>

          {/* Department Level */}
          <div>
            <div className="section-title">Department Heads</div>
            <div className="department-level">
              <OrgCard
                name={people.development.name}
                role={people.development.role}
                type="department"
              />
              <OrgCard
                name={people.tournament.name}
                role={people.tournament.role}
                type="department"
              />
              <OrgCard
                name={people.disciplinary.name}
                role={people.disciplinary.role}
                type="department"
              />
            </div>
          </div>

          {/* Connector */}
          <div className="level-connector">
            <div className="connector-line"></div>
          </div>

          {/* Sub-Committee Level */}
          <div className="subcommittee-level">
            <div className="section-title">Sub-Committee Members</div>
            <div className="subcommittee-grid">
              {people.subcommittee.map((member, index) => (
                <OrgCard
                  key={index}
                  name={member.name}
                  role={member.role}
                  type="subcommittee"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
