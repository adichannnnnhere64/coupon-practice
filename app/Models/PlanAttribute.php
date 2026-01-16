<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PlanAttribute extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['name', 'slug', 'type', 'unit', 'description'];

    public function plans()
    {
        return $this->belongsToMany(Plan::class, 'plan_plan_attribute')
            ->withPivot('value', 'is_unlimited')
            ->withTimestamps();
    }
}
