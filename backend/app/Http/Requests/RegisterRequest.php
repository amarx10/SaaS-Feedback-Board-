<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'             => ['required', 'string', 'max:100'],
            'username'         => ['required', 'string', 'max:50', 'unique:users,username', 'alpha_dash'],
            'email'            => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'         => ['required', 'string', 'min:8', 'confirmed'],
            'date_of_birth'    => ['nullable', 'date', 'before:today'],
            'bio'              => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'             => 'Your full name is required.',
            'username.required'         => 'Please choose a username.',
            'username.unique'           => 'That username is already taken.',
            'username.alpha_dash'       => 'Username may only contain letters, numbers, dashes, and underscores.',
            'email.required'            => 'An email address is required.',
            'email.unique'              => 'That email address is already registered.',
            'password.required'         => 'A password is required.',
            'password.min'              => 'Password must be at least 8 characters.',
            'password.confirmed'        => 'Passwords do not match.',
            'date_of_birth.before'      => 'Date of birth must be in the past.',
        ];
    }
}