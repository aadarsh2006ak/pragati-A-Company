const StudentProfile = require('../models/StudentProfile');
const CompanyProfile = require('../models/CompanyProfile');
const User = require('../models/User');

const getOffersByCompany = async (companyUserId) => {
  const studentProfiles = await StudentProfile.findAll({
    include: [{ model: User, as: 'user' }]
  });

  const companyOffers = [];

  for (const studentProfile of studentProfiles) {
    if (studentProfile.offers && Array.isArray(studentProfile.offers)) {
      for (const offer of studentProfile.offers) {
        if (String(offer.companyId) === String(companyUserId)) {
          companyOffers.push({
            id: offer.id,
            candidateId: studentProfile.userId,
            name: studentProfile.user ? studentProfile.user.name : 'Candidate',
            role: offer.role || 'Software Engineer',
            package: offer.package,
            status: offer.status,
            joining: offer.joining
          });
        }
      }
    }
  }

  return companyOffers;
};

const createOffer = async (companyUserId, payload) => {
  const { candidateId, package, joining, status } = payload;

  const studentProfile = await StudentProfile.findOne({ where: { userId: candidateId } });
  if (!studentProfile) throw new Error('Student profile not found');

  const companyProfile = await CompanyProfile.findOne({ where: { userId: companyUserId } });
  if (!companyProfile) throw new Error('Company profile not found');

  let driveTitle = 'Software Engineer';
  if (companyProfile.drives && Array.isArray(companyProfile.drives)) {
    const drive = companyProfile.drives.find(d => 
      d.applicants && d.applicants.some(a => String(a.student) === String(candidateId))
    );
    if (drive) driveTitle = drive.title;
  }

  const newOffer = {
    id: Date.now().toString(),
    companyId: companyUserId,
    companyName: companyProfile.companyName,
    role: driveTitle,
    package,
    joining,
    status: status || 'Sent',
    createdAt: new Date()
  };

  const currentOffers = studentProfile.offers ? JSON.parse(JSON.stringify(studentProfile.offers)) : [];
  
  // Prevent duplicate offer for same company/student
  const alreadyHasOffer = currentOffers.some(o => String(o.companyId) === String(companyUserId));
  if (!alreadyHasOffer) {
    currentOffers.push(newOffer);
    studentProfile.offers = currentOffers;
    await studentProfile.save();
  }

  // ALSO update candidate applicant status in the recruitment drive to 'Offered'
  let driveUpdated = false;
  const drivesCopy = JSON.parse(JSON.stringify(companyProfile.drives || []));
  for (const drive of drivesCopy) {
    if (drive.applicants && Array.isArray(drive.applicants)) {
      const applicant = drive.applicants.find(a => String(a.student) === String(candidateId));
      if (applicant) {
        applicant.status = 'Offered';
        driveUpdated = true;
      }
    }
  }

  if (driveUpdated) {
    companyProfile.drives = drivesCopy;
    await companyProfile.save();
  }

  return newOffer;
};

const updateOfferStatus = async (companyUserId, offerId, status) => {
  const studentProfiles = await StudentProfile.findAll();
  
  for (const studentProfile of studentProfiles) {
    if (studentProfile.offers && Array.isArray(studentProfile.offers)) {
      const offersCopy = JSON.parse(JSON.stringify(studentProfile.offers));
      const offerIndex = offersCopy.findIndex(o => String(o.id) === String(offerId) && String(o.companyId) === String(companyUserId));
      
      if (offerIndex !== -1) {
        offersCopy[offerIndex].status = status;
        studentProfile.offers = offersCopy;
        await studentProfile.save();

        const companyProfile = await CompanyProfile.findOne({ where: { userId: companyUserId } });
        if (companyProfile) {
          let driveUpdated = false;
          const drivesCopy = JSON.parse(JSON.stringify(companyProfile.drives || []));
          for (const drive of drivesCopy) {
            if (drive.applicants && Array.isArray(drive.applicants)) {
              const applicant = drive.applicants.find(a => String(a.student) === String(offersCopy[offerIndex].candidateId || studentProfile.userId));
              if (applicant) {
                applicant.status = status === 'Accepted' ? 'Accepted' : (status === 'Rejected' ? 'Rejected' : 'Offered');
                driveUpdated = true;
              }
            }
          }
          if (driveUpdated) {
            companyProfile.drives = drivesCopy;
            await companyProfile.save();
          }
        }

        return offersCopy[offerIndex];
      }
    }
  }

  throw new Error('Offer not found');
};

const deleteOffer = async (companyUserId, offerId) => {
  const studentProfiles = await StudentProfile.findAll();

  for (const studentProfile of studentProfiles) {
    if (studentProfile.offers && Array.isArray(studentProfile.offers)) {
      const offersCopy = JSON.parse(JSON.stringify(studentProfile.offers));
      const offerIndex = offersCopy.findIndex(o => String(o.id) === String(offerId) && String(o.companyId) === String(companyUserId));

      if (offerIndex !== -1) {
        const removedOffer = offersCopy.splice(offerIndex, 1)[0];
        studentProfile.offers = offersCopy;
        await studentProfile.save();

        const companyProfile = await CompanyProfile.findOne({ where: { userId: companyUserId } });
        if (companyProfile) {
          let driveUpdated = false;
          const drivesCopy = JSON.parse(JSON.stringify(companyProfile.drives || []));
          for (const drive of drivesCopy) {
            if (drive.applicants && Array.isArray(drive.applicants)) {
              const applicant = drive.applicants.find(a => String(a.student) === String(removedOffer.candidateId || studentProfile.userId));
              if (applicant) {
                applicant.status = 'Shortlisted';
                driveUpdated = true;
              }
            }
          }
          if (driveUpdated) {
            companyProfile.drives = drivesCopy;
            await companyProfile.save();
          }
        }

        return true;
      }
    }
  }

  return false;
};

module.exports = {
  getOffersByCompany,
  createOffer,
  updateOfferStatus,
  deleteOffer
};
