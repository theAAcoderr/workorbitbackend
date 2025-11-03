const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AnnouncementRead = sequelize.define('AnnouncementRead', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  announcementId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'announcements',
      key: 'id',
    },
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  readAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'announcement_reads',
  timestamps: false,
  indexes: [
    { fields: ['announcementId'] },
    { fields: ['userId'] },
    { fields: ['announcementId', 'userId'], unique: true },
  ],
});

module.exports = AnnouncementRead;
