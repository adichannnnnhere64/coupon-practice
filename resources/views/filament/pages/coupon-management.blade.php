<x-filament-panels::page>
    <style>
        @media (min-width: 1024px) {
            .coupon-grid { grid-template-columns: 1fr 3fr !important; }
        }
        .coupon-btn {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            font-weight: 500;
            border-radius: 0.5rem;
            transition: background-color 0.15s;
            border: none;
            cursor: pointer;
            text-align: left;
            background-color: transparent;
        }
        .coupon-btn-active {
            background-color: rgb(254 243 199);
            color: rgb(180 83 9);
        }
        .coupon-btn-inactive {
            background-color: transparent;
            color: rgb(55 65 81);
        }
        .coupon-btn-inactive:hover {
            background-color: rgb(243 244 246);
        }
        .dark .coupon-btn-active {
            background-color: rgba(251, 191, 36, 0.1);
            color: rgb(251 191 36);
        }
        .dark .coupon-btn-inactive {
            color: rgb(209 213 219);
        }
        .dark .coupon-btn-inactive:hover {
            background-color: rgba(255, 255, 255, 0.05);
        }
        .coupon-icon {
            width: 1rem;
            height: 1rem;
            flex-shrink: 0;
        }
        .coupon-icon-sm {
            width: 0.875rem;
            height: 0.875rem;
            flex-shrink: 0;
        }
        .coupon-badge {
            font-size: 0.75rem;
            padding: 0.125rem 0.5rem;
            border-radius: 9999px;
            background-color: rgb(229 231 235);
            color: rgb(55 65 81);
        }
        .dark .coupon-badge {
            background-color: rgb(55 65 81);
            color: rgb(209 213 219);
        }
        .coupon-nested {
            margin-left: 1.5rem;
            padding-left: 0.5rem;
            border-left: 2px solid rgb(229 231 235);
            margin-top: 0.25rem;
        }
        .dark .coupon-nested {
            border-left-color: rgb(55 65 81);
        }
        .coupon-plantype-btn {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.375rem 0.75rem;
            font-size: 0.875rem;
            border-radius: 0.5rem;
            transition: background-color 0.15s;
            border: none;
            cursor: pointer;
            text-align: left;
            background-color: transparent;
        }
        .coupon-divider {
            border-bottom: 1px solid rgb(229 231 235);
            padding-bottom: 0.25rem;
            margin-bottom: 0.25rem;
        }
        .dark .coupon-divider {
            border-bottom-color: rgb(55 65 81);
        }
    </style>

    <div class="coupon-grid" style="display: grid; grid-template-columns: 1fr; gap: 1.5rem;">
        {{-- Sidebar --}}
        <div>
            <x-filament::section>
                <x-slot name="heading">
                    Categories & Plan Types
                </x-slot>

                <div>
                    @forelse($this->getCategories() as $category)
                        <div class="coupon-divider">
                            {{-- Category Header --}}
                            <button
                                type="button"
                                wire:click="selectCategory({{ $category->id }})"
                                class="coupon-btn {{ $selectedCategoryId === $category->id ? 'coupon-btn-active' : 'coupon-btn-inactive' }}"
                            >
                                <span style="display: flex; align-items: center; gap: 0.5rem;">
                                    <x-filament::icon
                                        icon="heroicon-o-chevron-right"
                                        class="coupon-icon"
                                        style="{{ ($expandedCategories[$category->id] ?? false) ? 'transform: rotate(90deg);' : '' }}"
                                    />
                                    <x-filament::icon
                                        icon="heroicon-o-folder"
                                        class="coupon-icon"
                                    />
                                    <span>{{ $category->name }}</span>
                                </span>
                                <span class="coupon-badge">
                                    {{ $category->plan_types_count }}
                                </span>
                            </button>

                            {{-- Plan Types (expanded) --}}
                            @if($expandedCategories[$category->id] ?? false)
                                <div class="coupon-nested">
                                    @forelse($category->planTypes as $planType)
                                        <button
                                            type="button"
                                            wire:click="selectPlanType({{ $planType->id }})"
                                            class="coupon-plantype-btn {{ $selectedPlanTypeId === $planType->id ? 'coupon-btn-active' : 'coupon-btn-inactive' }}"
                                        >
                                            <span style="display: flex; align-items: center; gap: 0.5rem;">
                                                <x-filament::icon
                                                    icon="heroicon-o-tag"
                                                    class="coupon-icon-sm"
                                                />
                                                <span>{{ $planType->name }}</span>
                                            </span>
                                            <span class="coupon-badge">
                                                {{ $planType->plans_count }}
                                            </span>
                                        </button>
                                    @empty
                                        <p style="padding: 0.375rem 0.75rem; font-size: 0.75rem; color: rgb(156 163 175); font-style: italic;">
                                            No plan types
                                        </p>
                                    @endforelse
                                </div>
                            @endif
                        </div>
                    @empty
                        <div style="padding: 1rem; text-align: center;">
                            <p style="font-size: 0.875rem; color: rgb(107 114 128);">
                                No categories found.
                            </p>
                            <p style="font-size: 0.75rem; color: rgb(156 163 175); margin-top: 0.25rem;">
                                Create one using the button above.
                            </p>
                        </div>
                    @endforelse
                </div>
            </x-filament::section>
        </div>

        {{-- Main Content --}}
        <div>
            <x-filament::section>
                <x-slot name="heading">
                    @if($this->getSelectedPlanType())
                        Plans for "{{ $this->getSelectedPlanType()->name }}"
                    @elseif($this->getSelectedCategory())
                        All Plans in "{{ $this->getSelectedCategory()->name }}"
                    @else
                        Select a Category or Plan Type
                    @endif
                </x-slot>

                <x-slot name="description">
                    @if($this->getSelectedPlanType())
                        Manage plans and inventory for this plan type.
                    @elseif($this->getSelectedCategory())
                        Showing all plans across plan types in this category.
                    @else
                        Use the sidebar to navigate through your coupon hierarchy.
                    @endif
                </x-slot>

                {{ $this->table }}
            </x-filament::section>
        </div>
    </div>
</x-filament-panels::page>
