<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Category;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::orderBy('feedback_count', 'desc')->get();

        return response()->json([
            'success' => true,
            'data'    => $categories,
        ]);
    }
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:100',
            'slug'  => 'required|string|unique:categories',
            'color' => 'nullable|string',
            'icon'  => 'nullable|string',
        ]);

        if (empty($validated['icon'])) {
            $validated['icon'] = 'lightbulb';
        }

        $category = Category::create($validated);
        return response()->json(['success' => true, 'data' => $category], 201);
    }
    public function update(Request $request, int $id): JsonResponse
    {
        $category  = Category::findOrFail($id);
        $validated = $request->validate([
            'name'  => 'sometimes|string|max:100',
            'color' => 'nullable|string',
            'icon'  => 'nullable|string',
        ]);

        if (array_key_exists('icon', $validated) && empty($validated['icon'])) {
            $validated['icon'] = 'lightbulb';
        }

        $category->update($validated);
        return response()->json(['success' => true, 'data' => $category]);
    }
    public function destroy(int $id): JsonResponse
    {
        Category::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Category deleted.']);
    }
}