<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\DeliveryMethod;
use App\Models\Plan;
use App\Models\PlanAttribute;
use App\Models\PlanInventory;
use App\Models\PlanType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FullCatalogSeeder extends Seeder
{
    /**
     * Dummy image URLs from picsum.photos
     */
    protected array $categoryImages = [
        'https://picsum.photos/seed/cat1/400/300',
        'https://picsum.photos/seed/cat2/400/300',
        'https://picsum.photos/seed/cat3/400/300',
        'https://picsum.photos/seed/cat4/400/300',
        'https://picsum.photos/seed/cat5/400/300',
    ];

    protected array $planTypeImages = [
        'https://picsum.photos/seed/type1/400/300',
        'https://picsum.photos/seed/type2/400/300',
        'https://picsum.photos/seed/type3/400/300',
        'https://picsum.photos/seed/type4/400/300',
        'https://picsum.photos/seed/type5/400/300',
        'https://picsum.photos/seed/type6/400/300',
        'https://picsum.photos/seed/type7/400/300',
        'https://picsum.photos/seed/type8/400/300',
        'https://picsum.photos/seed/type9/400/300',
        'https://picsum.photos/seed/type10/400/300',
    ];

    protected array $planImages = [
        'https://picsum.photos/seed/plan1/600/400',
        'https://picsum.photos/seed/plan2/600/400',
        'https://picsum.photos/seed/plan3/600/400',
        'https://picsum.photos/seed/plan4/600/400',
        'https://picsum.photos/seed/plan5/600/400',
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Starting Full Catalog Seeder...');

        DB::transaction(function () {
            $this->seedDeliveryMethods();
            $this->seedPlanAttributes();
            $categories = $this->seedCategories();
            $this->seedPlanTypesAndPlans($categories);
        });

        $this->command->info('Full Catalog Seeder completed!');
    }

    /**
     * Seed delivery methods
     */
    protected function seedDeliveryMethods(): void
    {
        $this->command->info('Seeding delivery methods...');

        $deliveryMethods = [
            [
                'name' => 'email_default',
                'display_name' => 'Email Delivery',
                'type' => DeliveryMethod::TYPE_EMAIL,
                'settings' => ['template' => 'default'],
                'is_active' => true,
            ],
            [
                'name' => 'sms_delivery',
                'display_name' => 'SMS Delivery',
                'type' => DeliveryMethod::TYPE_SMS,
                'settings' => ['provider' => 'twilio'],
                'is_active' => true,
            ],
            [
                'name' => 'instant_download',
                'display_name' => 'Instant Download',
                'type' => DeliveryMethod::TYPE_MANUAL,
                'settings' => ['auto_download' => true],
                'is_active' => true,
            ],
            [
                'name' => 'api_delivery',
                'display_name' => 'API Integration',
                'type' => DeliveryMethod::TYPE_API,
                'settings' => ['endpoint' => '/api/deliver'],
                'is_active' => true,
            ],
            [
                'name' => 'webhook_notify',
                'display_name' => 'Webhook Notification',
                'type' => DeliveryMethod::TYPE_WEBHOOK,
                'settings' => ['url' => 'https://example.com/webhook'],
                'is_active' => false,
            ],
        ];

        foreach ($deliveryMethods as $method) {
            DeliveryMethod::updateOrCreate(
                ['name' => $method['name']],
                $method
            );
        }
    }

    /**
     * Seed plan attributes
     */
    protected function seedPlanAttributes(): void
    {
        $this->command->info('Seeding plan attributes...');

        $attributes = [
            ['name' => 'Data Allowance', 'slug' => 'data', 'type' => 'number', 'unit' => 'GB'],
            ['name' => 'Validity', 'slug' => 'validity', 'type' => 'number', 'unit' => 'days'],
            ['name' => 'Discount', 'slug' => 'discount', 'type' => 'number', 'unit' => '%'],
            ['name' => 'Store Credit', 'slug' => 'credit', 'type' => 'number', 'unit' => 'USD'],
            ['name' => 'Streaming Quality', 'slug' => 'streaming', 'type' => 'text', 'unit' => null],
            ['name' => 'Region', 'slug' => 'region', 'type' => 'text', 'unit' => null],
            ['name' => 'Devices', 'slug' => 'devices', 'type' => 'number', 'unit' => 'devices'],
            ['name' => 'Speed', 'slug' => 'speed', 'type' => 'number', 'unit' => 'Mbps'],
        ];

        foreach ($attributes as $attr) {
            PlanAttribute::updateOrCreate(
                ['slug' => $attr['slug']],
                $attr
            );
        }
    }

    /**
     * Seed categories
     */
    protected function seedCategories(): array
    {
        $this->command->info('Seeding categories...');

        $categoriesData = [
            [
                'name' => 'Streaming & Entertainment',
                'slug' => 'streaming-entertainment',
                'description' => 'Netflix, Spotify, Disney+, and other streaming service subscriptions and gift cards.',
                'is_active' => true,
            ],
            [
                'name' => 'Gaming',
                'slug' => 'gaming',
                'description' => 'PlayStation, Xbox, Steam, Nintendo, and other gaming platform gift cards and subscriptions.',
                'is_active' => true,
            ],
            [
                'name' => 'Shopping & Retail',
                'slug' => 'shopping-retail',
                'description' => 'Amazon, eBay, Walmart, and other retail store gift cards and discount coupons.',
                'is_active' => true,
            ],
            [
                'name' => 'Food & Dining',
                'slug' => 'food-dining',
                'description' => 'Restaurant gift cards, food delivery vouchers, and dining discounts.',
                'is_active' => true,
            ],
            [
                'name' => 'Software & Apps',
                'slug' => 'software-apps',
                'description' => 'Software licenses, app subscriptions, and digital tool vouchers.',
                'is_active' => true,
            ],
        ];

        $categories = [];
        foreach ($categoriesData as $index => $data) {
            $category = Category::updateOrCreate(
                ['slug' => $data['slug']],
                $data
            );

            // Add image
            $this->attachImage($category, 'icons', $this->categoryImages[$index] ?? $this->categoryImages[0]);

            $categories[] = $category;
        }

        return $categories;
    }

    /**
     * Seed plan types and their plans
     */
    protected function seedPlanTypesAndPlans(array $categories): void
    {
        $this->command->info('Seeding plan types and plans...');

        // Get delivery methods
        $emailDelivery = DeliveryMethod::where('name', 'email_default')->first();
        $smsDelivery = DeliveryMethod::where('name', 'sms_delivery')->first();
        $instantDownload = DeliveryMethod::where('name', 'instant_download')->first();

        // Get attributes
        $attributes = PlanAttribute::all()->keyBy('slug');

        $planTypesData = [
            // Streaming & Entertainment
            [
                'category_index' => 0,
                'name' => 'Netflix',
                'slug' => 'netflix',
                'description' => 'Netflix gift cards and subscription codes for unlimited streaming.',
                'plans' => [
                    ['name' => 'Netflix $15 Gift Card', 'base' => 15.00, 'actual' => 14.25, 'inv' => 25, 'attrs' => ['credit' => 15, 'region' => 'US']],
                    ['name' => 'Netflix $25 Gift Card', 'base' => 25.00, 'actual' => 23.50, 'inv' => 20, 'attrs' => ['credit' => 25, 'region' => 'US']],
                    ['name' => 'Netflix $50 Gift Card', 'base' => 50.00, 'actual' => 46.00, 'inv' => 15, 'attrs' => ['credit' => 50, 'region' => 'US']],
                    ['name' => 'Netflix Premium 1 Month', 'base' => 22.99, 'actual' => 19.99, 'inv' => 30, 'attrs' => ['validity' => 30, 'streaming' => '4K Ultra HD', 'devices' => 4]],
                ],
            ],
            [
                'category_index' => 0,
                'name' => 'Spotify',
                'slug' => 'spotify',
                'description' => 'Spotify Premium subscription codes and gift cards.',
                'plans' => [
                    ['name' => 'Spotify Premium 1 Month', 'base' => 10.99, 'actual' => 9.49, 'inv' => 50, 'attrs' => ['validity' => 30, 'streaming' => 'High Quality']],
                    ['name' => 'Spotify Premium 3 Months', 'base' => 32.97, 'actual' => 27.99, 'inv' => 30, 'attrs' => ['validity' => 90, 'streaming' => 'High Quality']],
                    ['name' => 'Spotify Premium 12 Months', 'base' => 131.88, 'actual' => 99.99, 'inv' => 15, 'attrs' => ['validity' => 365, 'streaming' => 'High Quality']],
                ],
            ],
            [
                'category_index' => 0,
                'name' => 'Disney+',
                'slug' => 'disney-plus',
                'description' => 'Disney+ subscription codes for family entertainment.',
                'plans' => [
                    ['name' => 'Disney+ 1 Month', 'base' => 13.99, 'actual' => 11.99, 'inv' => 40, 'attrs' => ['validity' => 30, 'streaming' => '4K', 'devices' => 4]],
                    ['name' => 'Disney+ 12 Months', 'base' => 139.99, 'actual' => 109.99, 'inv' => 20, 'attrs' => ['validity' => 365, 'streaming' => '4K', 'devices' => 4]],
                ],
            ],

            // Gaming
            [
                'category_index' => 1,
                'name' => 'Steam',
                'slug' => 'steam',
                'description' => 'Steam wallet codes and gift cards for PC gaming.',
                'plans' => [
                    ['name' => 'Steam $10 Wallet Code', 'base' => 10.00, 'actual' => 9.50, 'inv' => 100, 'attrs' => ['credit' => 10, 'region' => 'Global']],
                    ['name' => 'Steam $25 Wallet Code', 'base' => 25.00, 'actual' => 23.75, 'inv' => 75, 'attrs' => ['credit' => 25, 'region' => 'Global']],
                    ['name' => 'Steam $50 Wallet Code', 'base' => 50.00, 'actual' => 47.00, 'inv' => 50, 'attrs' => ['credit' => 50, 'region' => 'Global']],
                    ['name' => 'Steam $100 Wallet Code', 'base' => 100.00, 'actual' => 92.00, 'inv' => 25, 'attrs' => ['credit' => 100, 'region' => 'Global']],
                ],
            ],
            [
                'category_index' => 1,
                'name' => 'PlayStation',
                'slug' => 'playstation',
                'description' => 'PlayStation Store gift cards and PS Plus subscriptions.',
                'plans' => [
                    ['name' => 'PSN $25 Gift Card', 'base' => 25.00, 'actual' => 23.99, 'inv' => 60, 'attrs' => ['credit' => 25, 'region' => 'US']],
                    ['name' => 'PSN $50 Gift Card', 'base' => 50.00, 'actual' => 47.50, 'inv' => 40, 'attrs' => ['credit' => 50, 'region' => 'US']],
                    ['name' => 'PS Plus Essential 12 Months', 'base' => 59.99, 'actual' => 49.99, 'inv' => 30, 'attrs' => ['validity' => 365]],
                    ['name' => 'PS Plus Premium 12 Months', 'base' => 159.99, 'actual' => 134.99, 'inv' => 15, 'attrs' => ['validity' => 365]],
                ],
            ],
            [
                'category_index' => 1,
                'name' => 'Xbox',
                'slug' => 'xbox',
                'description' => 'Xbox gift cards and Game Pass subscriptions.',
                'plans' => [
                    ['name' => 'Xbox $25 Gift Card', 'base' => 25.00, 'actual' => 24.00, 'inv' => 55, 'attrs' => ['credit' => 25, 'region' => 'US']],
                    ['name' => 'Xbox $50 Gift Card', 'base' => 50.00, 'actual' => 47.99, 'inv' => 35, 'attrs' => ['credit' => 50, 'region' => 'US']],
                    ['name' => 'Xbox Game Pass Ultimate 1 Month', 'base' => 16.99, 'actual' => 14.49, 'inv' => 80, 'attrs' => ['validity' => 30]],
                    ['name' => 'Xbox Game Pass Ultimate 3 Months', 'base' => 44.99, 'actual' => 39.99, 'inv' => 40, 'attrs' => ['validity' => 90]],
                ],
            ],

            // Shopping & Retail
            [
                'category_index' => 2,
                'name' => 'Amazon',
                'slug' => 'amazon',
                'description' => 'Amazon gift cards for millions of products.',
                'plans' => [
                    ['name' => 'Amazon $25 Gift Card', 'base' => 25.00, 'actual' => 24.50, 'inv' => 100, 'attrs' => ['credit' => 25, 'region' => 'US']],
                    ['name' => 'Amazon $50 Gift Card', 'base' => 50.00, 'actual' => 48.50, 'inv' => 75, 'attrs' => ['credit' => 50, 'region' => 'US']],
                    ['name' => 'Amazon $100 Gift Card', 'base' => 100.00, 'actual' => 96.00, 'inv' => 50, 'attrs' => ['credit' => 100, 'region' => 'US']],
                ],
            ],
            [
                'category_index' => 2,
                'name' => 'eBay',
                'slug' => 'ebay',
                'description' => 'eBay gift cards for auctions and shopping.',
                'plans' => [
                    ['name' => 'eBay $25 Gift Card', 'base' => 25.00, 'actual' => 23.75, 'inv' => 45, 'attrs' => ['credit' => 25, 'region' => 'US']],
                    ['name' => 'eBay $50 Gift Card', 'base' => 50.00, 'actual' => 47.00, 'inv' => 30, 'attrs' => ['credit' => 50, 'region' => 'US']],
                ],
            ],

            // Food & Dining
            [
                'category_index' => 3,
                'name' => 'DoorDash',
                'slug' => 'doordash',
                'description' => 'DoorDash gift cards for food delivery.',
                'plans' => [
                    ['name' => 'DoorDash $25 Gift Card', 'base' => 25.00, 'actual' => 23.50, 'inv' => 60, 'attrs' => ['credit' => 25, 'region' => 'US']],
                    ['name' => 'DoorDash $50 Gift Card', 'base' => 50.00, 'actual' => 46.00, 'inv' => 40, 'attrs' => ['credit' => 50, 'region' => 'US']],
                ],
            ],
            [
                'category_index' => 3,
                'name' => 'Uber Eats',
                'slug' => 'uber-eats',
                'description' => 'Uber Eats gift cards for food delivery.',
                'plans' => [
                    ['name' => 'Uber Eats $15 Gift Card', 'base' => 15.00, 'actual' => 14.00, 'inv' => 70, 'attrs' => ['credit' => 15, 'region' => 'US']],
                    ['name' => 'Uber Eats $25 Gift Card', 'base' => 25.00, 'actual' => 23.00, 'inv' => 55, 'attrs' => ['credit' => 25, 'region' => 'US']],
                    ['name' => 'Uber Eats $50 Gift Card', 'base' => 50.00, 'actual' => 45.00, 'inv' => 35, 'attrs' => ['credit' => 50, 'region' => 'US']],
                ],
            ],
            [
                'category_index' => 3,
                'name' => 'Starbucks',
                'slug' => 'starbucks',
                'description' => 'Starbucks gift cards for coffee lovers.',
                'plans' => [
                    ['name' => 'Starbucks $10 Gift Card', 'base' => 10.00, 'actual' => 9.50, 'inv' => 90, 'attrs' => ['credit' => 10, 'region' => 'US']],
                    ['name' => 'Starbucks $25 Gift Card', 'base' => 25.00, 'actual' => 23.50, 'inv' => 65, 'attrs' => ['credit' => 25, 'region' => 'US']],
                ],
            ],

            // Software & Apps
            [
                'category_index' => 4,
                'name' => 'Microsoft 365',
                'slug' => 'microsoft-365',
                'description' => 'Microsoft 365 subscription codes for Office apps.',
                'plans' => [
                    ['name' => 'Microsoft 365 Personal 1 Year', 'base' => 69.99, 'actual' => 59.99, 'inv' => 25, 'attrs' => ['validity' => 365, 'devices' => 5]],
                    ['name' => 'Microsoft 365 Family 1 Year', 'base' => 99.99, 'actual' => 84.99, 'inv' => 20, 'attrs' => ['validity' => 365, 'devices' => 6]],
                ],
            ],
            [
                'category_index' => 4,
                'name' => 'Adobe Creative Cloud',
                'slug' => 'adobe-cc',
                'description' => 'Adobe Creative Cloud subscription codes.',
                'plans' => [
                    ['name' => 'Adobe CC Photography Plan 1 Month', 'base' => 9.99, 'actual' => 8.49, 'inv' => 40, 'attrs' => ['validity' => 30]],
                    ['name' => 'Adobe CC All Apps 1 Month', 'base' => 54.99, 'actual' => 47.99, 'inv' => 20, 'attrs' => ['validity' => 30]],
                ],
            ],
            [
                'category_index' => 4,
                'name' => 'NordVPN',
                'slug' => 'nordvpn',
                'description' => 'NordVPN subscription codes for secure browsing.',
                'plans' => [
                    ['name' => 'NordVPN 1 Month', 'base' => 12.99, 'actual' => 10.99, 'inv' => 60, 'attrs' => ['validity' => 30, 'devices' => 6]],
                    ['name' => 'NordVPN 1 Year', 'base' => 59.88, 'actual' => 44.99, 'inv' => 35, 'attrs' => ['validity' => 365, 'devices' => 6]],
                    ['name' => 'NordVPN 2 Years', 'base' => 107.76, 'actual' => 79.99, 'inv' => 20, 'attrs' => ['validity' => 730, 'devices' => 6]],
                ],
            ],
        ];

        $planTypeIndex = 0;
        foreach ($planTypesData as $ptData) {
            $category = $categories[$ptData['category_index']];

            // Create plan type
            $planType = PlanType::updateOrCreate(
                ['slug' => $ptData['slug']],
                [
                    'name' => $ptData['name'],
                    'description' => $ptData['description'],
                    'is_active' => true,
                ]
            );

            // Attach to category
            $planType->categories()->syncWithoutDetaching([$category->id]);

            // Add image
            $imageUrl = $this->planTypeImages[$planTypeIndex % count($this->planTypeImages)];
            $this->attachImage($planType, 'icons', $imageUrl);

            $this->command->info("  Created plan type: {$ptData['name']}");

            // Create plans
            foreach ($ptData['plans'] as $planIndex => $planData) {
                $plan = Plan::updateOrCreate(
                    ['plan_type_id' => $planType->id, 'name' => $planData['name']],
                    [
                        'base_price' => $planData['base'],
                        'actual_price' => $planData['actual'],
                        'description' => "Get {$planData['name']} at a discounted price. Limited time offer!",
                        'is_active' => true,
                        'inventory_enabled' => true,
                        'low_stock_threshold' => 5,
                    ]
                );

                // Attach delivery methods
                $deliveryMethodsToAttach = [];
                if ($emailDelivery) {
                    $deliveryMethodsToAttach[$emailDelivery->id] = ['is_default' => true, 'sort_order' => 0];
                }
                if ($smsDelivery && $planIndex % 2 === 0) {
                    $deliveryMethodsToAttach[$smsDelivery->id] = ['is_default' => false, 'sort_order' => 1];
                }
                if ($instantDownload && $planIndex % 3 === 0) {
                    $deliveryMethodsToAttach[$instantDownload->id] = ['is_default' => false, 'sort_order' => 2];
                }
                $plan->deliveryMethods()->sync($deliveryMethodsToAttach);

                // Attach attributes
                if (isset($planData['attrs'])) {
                    $attrsToAttach = [];
                    foreach ($planData['attrs'] as $attrSlug => $value) {
                        if (isset($attributes[$attrSlug])) {
                            $attrsToAttach[$attributes[$attrSlug]->id] = [
                                'value' => is_numeric($value) ? (string) $value : $value,
                                'is_unlimited' => false,
                            ];
                        }
                    }
                    $plan->attributes()->sync($attrsToAttach);
                }

                // Add plan image
                $planImageUrl = $this->planImages[$planIndex % count($this->planImages)];
                $this->attachImage($plan, 'images', $planImageUrl);

                // Create inventory
                $this->createInventory($plan, $planData['inv']);
            }

            $planTypeIndex++;
        }
    }

    /**
     * Create inventory items for a plan
     */
    protected function createInventory(Plan $plan, int $count): void
    {
        // Delete existing inventory for this plan (for re-seeding)
        // $plan->inventories()->delete();

        $existing = $plan->inventories()->count();
        $toCreate = max(0, $count - $existing);

        for ($i = 0; $i < $toCreate; $i++) {
            $code = $this->generateUniqueCode();

            PlanInventory::create([
                'plan_id' => $plan->id,
                'code' => $code,
                'status' => PlanInventory::STATUS_AVAILABLE,
                'delivery_status' => 'pending',
                'meta_data' => [
                    'generated_at' => now()->toIso8601String(),
                    'batch' => 'seeder_'.date('Y-m-d'),
                ],
            ]);
        }

        $this->command->info("    Created {$toCreate} inventory items for: {$plan->name}");
    }

    /**
     * Generate a unique inventory code
     */
    protected function generateUniqueCode(): string
    {
        do {
            $code = strtoupper(Str::random(4).'-'.Str::random(4).'-'.Str::random(4));
        } while (PlanInventory::where('code', $code)->exists());

        return $code;
    }

    /**
     * Attach an image from URL to a model
     */
    protected function attachImage($model, string $collection, string $url): void
    {
        try {
            // Check if model already has media in this collection
            if ($model->getMedia($collection)->isNotEmpty()) {
                return;
            }

            // Download and attach image
            $model->addMediaFromUrl($url)
                ->toMediaCollection($collection);
        } catch (\Exception $e) {
            $this->command->warn("    Failed to attach image for {$model->name}: ".$e->getMessage());
        }
    }
}
