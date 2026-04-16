from django.core.management.base import BaseCommand

from expenses.models import ExpenseCategory, ExpenseCode

SEED_DATA = {
    'Travel': [
        ('TRV-001', 'Domestic travel'),
        ('TRV-002', 'International travel'),
        ('TRV-003', 'Travel insurance'),
        ('TRV-004', 'Car rental'),
        ('TRV-005', 'Ride sharing'),
        ('TRV-006', 'Parking fees'),
        ('TRV-007', 'Tolls'),
        ('TRV-008', 'Baggage fees'),
        ('TRV-009', 'Visa fees'),
        ('TRV-010', 'Airport lounge'),
        ('TRV-011', 'Per diem meals'),
        ('TRV-012', 'Hotel accommodation'),
        ('TRV-013', 'Train tickets'),
        ('TRV-014', 'Ferry tickets'),
        ('TRV-015', 'Fuel reimbursement'),
        ('TRV-016', 'Mileage allowance'),
        ('TRV-017', 'Travel agency fees'),
        ('TRV-018', 'Currency exchange fees'),
        ('TRV-019', 'Travel vaccinations'),
        ('TRV-020', 'Luggage storage'),
    ],
    'Office Supplies': [
        ('OFF-001', 'Stationery'),
        ('OFF-002', 'Furniture'),
        ('OFF-003', 'Electronics'),
        ('OFF-004', 'Cleaning supplies'),
        ('OFF-005', 'Printer ink and toner'),
        ('OFF-006', 'Paper products'),
        ('OFF-007', 'Desk accessories'),
        ('OFF-008', 'Filing supplies'),
        ('OFF-009', 'Breakroom supplies'),
        ('OFF-010', 'First aid supplies'),
        ('OFF-011', 'Whiteboards and markers'),
        ('OFF-012', 'Shipping materials'),
        ('OFF-013', 'Name badges and lanyards'),
    ],
    'Software': [
        ('SFT-001', 'SaaS subscriptions'),
        ('SFT-002', 'Licenses'),
        ('SFT-003', 'Cloud hosting'),
        ('SFT-004', 'Domain registration'),
        ('SFT-005', 'SSL certificates'),
        ('SFT-006', 'Dev tools'),
        ('SFT-007', 'Monitoring services'),
        ('SFT-008', 'API integrations'),
        ('SFT-009', 'Database services'),
        ('SFT-010', 'CDN services'),
        ('SFT-011', 'Email service providers'),
        ('SFT-012', 'Analytics platforms'),
        ('SFT-013', 'CI/CD tools'),
        ('SFT-014', 'Code signing certificates'),
    ],
    'Marketing': [
        ('MKT-001', 'Advertising'),
        ('MKT-002', 'Events'),
        ('MKT-003', 'Promotional materials'),
        ('MKT-004', 'Sponsorships'),
        ('MKT-005', 'Social media ads'),
        ('MKT-006', 'Print media'),
        ('MKT-007', 'SEO services'),
        ('MKT-008', 'Content creation'),
        ('MKT-009', 'Photography'),
        ('MKT-010', 'Video production'),
        ('MKT-011', 'Influencer partnerships'),
        ('MKT-012', 'Trade shows'),
        ('MKT-013', 'Email campaigns'),
    ],
    'Human Resources': [
        ('HR-001', 'Recruitment fees'),
        ('HR-002', 'Training programs'),
        ('HR-003', 'Team building'),
        ('HR-004', 'Employee gifts'),
        ('HR-005', 'Relocation'),
        ('HR-006', 'Background checks'),
        ('HR-007', 'Job board subscriptions'),
        ('HR-008', 'Onboarding materials'),
    ],
    'Legal': [
        ('LGL-001', 'Legal counsel'),
        ('LGL-002', 'Contract review'),
        ('LGL-003', 'Compliance audit'),
        ('LGL-004', 'Patent filing'),
        ('LGL-005', 'Trademark registration'),
        ('LGL-006', 'Dispute resolution'),
        ('LGL-007', 'Regulatory filings'),
    ],
    'Facilities': [
        ('FAC-001', 'Office rent'),
        ('FAC-002', 'Utilities'),
        ('FAC-003', 'Maintenance'),
        ('FAC-004', 'Security services'),
        ('FAC-005', 'Janitorial'),
        ('FAC-006', 'Pest control'),
        ('FAC-007', 'Landscaping'),
        ('FAC-008', 'Waste disposal'),
    ],
    'Research & Development': [
        ('RND-001', 'Lab equipment'),
        ('RND-002', 'Prototyping'),
        ('RND-003', 'Testing services'),
        ('RND-004', 'Research subscriptions'),
        ('RND-005', 'Conference attendance'),
        ('RND-006', 'Academic partnerships'),
        ('RND-007', 'Field studies'),
    ],
    'Finance': [
        ('FIN-001', 'Audit fees'),
        ('FIN-002', 'Banking charges'),
        ('FIN-003', 'Insurance premiums'),
        ('FIN-004', 'Tax preparation'),
        ('FIN-005', 'Financial advisory'),
        ('FIN-006', 'Payroll processing'),
        ('FIN-007', 'Credit card fees'),
    ],
    'IT Infrastructure': [
        ('IT-001', 'Server hardware'),
        ('IT-002', 'Network equipment'),
        ('IT-003', 'Backup services'),
        ('IT-004', 'Cybersecurity tools'),
        ('IT-005', 'Help desk software'),
        ('IT-006', 'VPN services'),
        ('IT-007', 'Hardware repairs'),
        ('IT-008', 'Cable and wiring'),
    ],
    'Professional Services': [
        ('PRO-001', 'Consulting'),
        ('PRO-002', 'Freelance contractors'),
        ('PRO-003', 'Design services'),
        ('PRO-004', 'Translation services'),
        ('PRO-005', 'Accounting services'),
        ('PRO-006', 'Engineering consultants'),
        ('PRO-007', 'Market research'),
    ],
    'Communications': [
        ('COM-001', 'Phone plans'),
        ('COM-002', 'Internet service'),
        ('COM-003', 'Video conferencing'),
        ('COM-004', 'Messaging platforms'),
        ('COM-005', 'Postal services'),
        ('COM-006', 'Courier services'),
        ('COM-007', 'Press releases'),
    ],
}


class Command(BaseCommand):
    help = 'Seed expense categories and codes for local development'

    def handle(self, *args, **options):
        for category_name, codes in SEED_DATA.items():
            category, created = ExpenseCategory.objects.get_or_create(
                name=category_name
            )
            status = 'Created' if created else 'Already exists'
            self.stdout.write(f'  Category: {category_name} - {status}')

            for code_str, description in codes:
                _, code_created = ExpenseCode.objects.get_or_create(
                    code=code_str,
                    defaults={
                        'category': category,
                        'description': description,
                    },
                )
                code_status = 'Created' if code_created else 'Already exists'
                self.stdout.write(f'    Code: {code_str} - {code_status}')

        self.stdout.write(self.style.SUCCESS('Seed data complete.'))
