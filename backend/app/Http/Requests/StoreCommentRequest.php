<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'body'      => ['required', 'string', 'max:1000'],
            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('comments', 'id')->where(function ($query) {
                    $query->where('feedback_id', (int) $this->route('id'))
                          ->whereNull('parent_id');
                }),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'body.required' => 'Comment cannot be empty.',
            'body.max'      => 'Comment cannot exceed 1000 characters.',
            'parent_id.exists' => 'You can only reply to a top-level comment.',
        ];
    }
}