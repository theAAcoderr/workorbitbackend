'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create Meetings table
    await queryInterface.createTable('Meetings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM(
          'teamMeeting',
          'oneOnOne',
          'allHands',
          'clientMeeting',
          'training',
          'interview',
          'boardMeeting',
          'other'
        ),
        allowNull: false,
        defaultValue: 'teamMeeting'
      },
      status: {
        type: Sequelize.ENUM(
          'scheduled',
          'inProgress',
          'completed',
          'cancelled',
          'postponed'
        ),
        allowNull: false,
        defaultValue: 'scheduled'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium'
      },
      startTime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      endTime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      meetingLink: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      organizationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      hrCode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdByName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      createdByHrCode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      agendaItems: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isRecurring: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      recurringPattern: {
        type: Sequelize.ENUM('daily', 'weekly', 'monthly'),
        allowNull: true
      },
      parentMeetingId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Meetings',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      isPrivate: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      allowGuestJoin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cancelledAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cancellationReason: {
        type: Sequelize.STRING,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create MeetingAttendees table
    await queryInterface.createTable('MeetingAttendees', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      meetingId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Meetings',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      userEmail: {
        type: Sequelize.STRING,
        allowNull: false
      },
      userHrCode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM(
          'pending',
          'accepted',
          'declined',
          'tentative',
          'attended',
          'absent'
        ),
        allowNull: false,
        defaultValue: 'pending'
      },
      isOrganizer: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isRequired: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      hasJoined: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      joinedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      response: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      respondedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      notificationsSent: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create MeetingActions table
    await queryInterface.createTable('MeetingActions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      meetingId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Meetings',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      assignedTo: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      assignedToName: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: ''
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium'
      },
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      isCompleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      dueDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes for Meetings
    await queryInterface.addIndex('Meetings', ['organizationId'], {
      name: 'idx_meetings_organization'
    });

    await queryInterface.addIndex('Meetings', ['hrCode'], {
      name: 'idx_meetings_hr_code'
    });

    await queryInterface.addIndex('Meetings', ['createdBy'], {
      name: 'idx_meetings_created_by'
    });

    await queryInterface.addIndex('Meetings', ['startTime'], {
      name: 'idx_meetings_start_time'
    });

    await queryInterface.addIndex('Meetings', ['status'], {
      name: 'idx_meetings_status'
    });

    await queryInterface.addIndex('Meetings', ['type'], {
      name: 'idx_meetings_type'
    });

    // Add indexes for MeetingAttendees
    await queryInterface.addIndex('MeetingAttendees', ['meetingId'], {
      name: 'idx_meeting_attendees_meeting'
    });

    await queryInterface.addIndex('MeetingAttendees', ['userId'], {
      name: 'idx_meeting_attendees_user'
    });

    await queryInterface.addIndex('MeetingAttendees', ['status'], {
      name: 'idx_meeting_attendees_status'
    });

    await queryInterface.addIndex('MeetingAttendees', ['meetingId', 'userId'], {
      name: 'idx_meeting_attendees_meeting_user',
      unique: true
    });

    // Add indexes for MeetingActions
    await queryInterface.addIndex('MeetingActions', ['meetingId'], {
      name: 'idx_meeting_actions_meeting'
    });

    await queryInterface.addIndex('MeetingActions', ['assignedTo'], {
      name: 'idx_meeting_actions_assigned_to'
    });

    await queryInterface.addIndex('MeetingActions', ['status'], {
      name: 'idx_meeting_actions_status'
    });

    await queryInterface.addIndex('MeetingActions', ['dueDate'], {
      name: 'idx_meeting_actions_due_date'
    });

    await queryInterface.addIndex('MeetingActions', ['isCompleted'], {
      name: 'idx_meeting_actions_completed'
    });

    console.log('✅ Meeting system tables created successfully');
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('MeetingActions');
    await queryInterface.dropTable('MeetingAttendees');
    await queryInterface.dropTable('Meetings');

    console.log('✅ Meeting system tables dropped successfully');
  }
};
