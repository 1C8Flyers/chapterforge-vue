# Sample Data Script - Add sample members for testing
Write-Host "Adding sample members to database..." -ForegroundColor Yellow

# This script adds sample data to help you test the application
# Run this after setup.ps1

$env:NODE_ENV = "development"

node -e "
const db = require('./database');

const sampleMembers = [
  {
    FirstName: 'John',
    LastName: 'Smith',
    EAANumber: '123456',
    Email: 'john.smith@example.com',
    Phone: '555-0101',
    MemberType: 'Individual',
    Status: 'Active',
    DuesRate: 50.00,
    LastPaidYear: 2025,
    HouseholdID: 1
  },
  {
    FirstName: 'Jane',
    LastName: 'Smith',
    AdditionalFamilyMembers: 'Spouse: John Smith',
    Email: 'jane.smith@example.com',
    Phone: '555-0101',
    MemberType: 'Family',
    Status: 'Active',
    DuesRate: 75.00,
    LastPaidYear: 2025,
    HouseholdID: 1
  },
  {
    FirstName: 'Robert',
    LastName: 'Johnson',
    EAANumber: '789012',
    Email: 'robert.johnson@example.com',
    Phone: '555-0102',
    MemberType: 'Individual',
    Status: 'Active',
    DuesRate: 50.00,
    LastPaidYear: 2024,
    AmountDue: 50.00
  },
  {
    FirstName: 'Emily',
    LastName: 'Davis',
    EAANumber: '345678',
    Email: 'emily.davis@example.com',
    Phone: '555-0103',
    MemberType: 'Student',
    Status: 'Active',
    DuesRate: 25.00,
    LastPaidYear: 2023,
    AmountDue: 25.00
  },
  {
    FirstName: 'Michael',
    LastName: 'Wilson',
    EAANumber: '901234',
    Email: 'michael.wilson@example.com',
    Phone: '555-0104',
    MemberType: 'Lifetime',
    Status: 'Active',
    DuesRate: 0.00,
    LastPaidYear: 2026
  }
];

async function addSamples() {
  for (const member of sampleMembers) {
    try {
      await db.createMember(member);
      console.log('Added:', member.FirstName, member.LastName);
    } catch (error) {
      console.error('Error adding member:', error.message);
    }
  }
  console.log('Sample data added successfully!');
  process.exit(0);
}

addSamples();
"

Write-Host "✓ Sample members added!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now view these members at http://localhost:3000/members" -ForegroundColor Cyan
