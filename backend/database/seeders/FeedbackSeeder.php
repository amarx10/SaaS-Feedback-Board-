<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use App\Models\Feedback;
use App\Models\User;
use App\Models\Category;
use App\Models\Vote;
use App\Models\Comment;

class FeedbackSeeder extends Seeder
{
    public function run(): void
    {
        $users      = User::where('is_admin', false)->get();
        $categories = Category::all()->keyBy('slug');

        // ---------------------------------------------------------------
        // 1. Curated seed feedback (keeps your original 14 items intact)
        // ---------------------------------------------------------------
        $feedbackData = [
            [
                'title'       => 'Dark mode support',
                'description' => 'It would be great to have a dark mode option for the application. This would help reduce eye strain during night usage.',
                'status'      => 'open',
                'user'        => 'sarahchen',
                'category'    => 'feature-request',
                'created_at'  => Carbon::now()->subDays(30)->subHours(3),
                'views'       => 3200,
                'upvotes'     => 115,
                'downvotes'   => 5,
                'comments'    => 32,
            ],
            [
                'title'       => 'Custom keyboard shortcuts',
                'description' => 'Allow users to customize keyboard shortcuts for frequently used actions. This would significantly speed up workflow.',
                'status'      => 'planned',
                'user'        => 'mikejohnson',
                'category'    => 'improvement',
                'created_at'  => Carbon::now()->subDays(10)->subHours(5),
                'views'       => 2400,
                'upvotes'     => 78,
                'downvotes'   => 8,
                'comments'    => 18,
            ],
            [
                'title'       => 'Mobile app for iOS and Android',
                'description' => 'A mobile app would make it easier to stay updated on feedback and roadmap from anywhere.',
                'status'      => 'in_progress',
                'user'        => 'davidwilson',
                'category'    => 'feature-request',
                'created_at'  => Carbon::now()->subDays(5)->subHours(4),
                'views'       => 4100,
                'upvotes'     => 95,
                'downvotes'   => 10,
                'comments'    => 42,
            ],
            [
                'title'       => 'Advanced search filters',
                'description' => 'More advanced filtering options in search to quickly find relevant feedback based on multiple criteria.',
                'status'      => 'open',
                'user'        => 'annalee',
                'category'    => 'improvement',
                'created_at'  => Carbon::now()->subHours(2),
                'views'       => 1800,
                'upvotes'     => 54,
                'downvotes'   => 6,
                'comments'    => 27,
            ],
            [
                'title'       => 'Integrate with Slack',
                'description' => 'It would be great to receive notifications and updates directly in Slack so the team stays informed.',
                'status'      => 'planned',
                'user'        => 'tomking',
                'category'    => 'feature-request',
                'created_at'  => Carbon::now()->subDays(8)->subHours(2),
                'views'       => 2200,
                'upvotes'     => 48,
                'downvotes'   => 12,
                'comments'    => 22,
            ],
            [
                'title'       => 'Autosave draft feedback',
                'description' => 'Save partially written feedback drafts automatically so users do not lose content when they navigate away or refresh.',
                'status'      => 'open',
                'user'        => 'sarahchen',
                'category'    => 'improvement',
                'created_at'  => Carbon::now()->subDay(),
                'views'       => 1700,
                'upvotes'     => 28,
                'downvotes'   => 3,
                'comments'    => 10,
            ],
            [
                'title'       => 'Bug: notifications still show after read',
                'description' => 'Even after marking notifications as read, the indicator remains active in the header. Steps to reproduce are included.',
                'status'      => 'open',
                'user'        => 'mikejohnson',
                'category'    => 'bug-report',
                'created_at'  => Carbon::now()->subDays(12)->subHours(6),
                'views'       => 2600,
                'upvotes'     => 40,
                'downvotes'   => 35,
                'comments'    => 38,
            ],
            [
                'title'       => 'Improve onboarding checklist',
                'description' => 'A more detailed onboarding checklist would help new users understand key actions and first steps.',
                'status'      => 'planned',
                'user'        => 'annalee',
                'category'    => 'ui-ux-suggestion',
                'created_at'  => Carbon::now()->subDays(4)->subHours(2),
                'views'       => 1600,
                'upvotes'     => 30,
                'downvotes'   => 5,
                'comments'    => 14,
            ],
            [
                'title'       => 'Allow markdown notes in feedback',
                'description' => 'Support markdown formatting in feedback descriptions and comments to make issue reports easier to scan.',
                'status'      => 'open',
                'user'        => 'davidwilson',
                'category'    => 'feature-request',
                'created_at'  => Carbon::now()->subHours(20),
                'views'       => 2500,
                'upvotes'     => 68,
                'downvotes'   => 7,
                'comments'    => 20,
            ],
            [
                'title'       => 'Dark mode schedule',
                'description' => 'Allow dark mode to activate automatically based on local sunrise and sunset times.',
                'status'      => 'open',
                'user'        => 'tomking',
                'category'    => 'feature-request',
                'created_at'  => Carbon::now()->subHours(14),
                'views'       => 900,
                'upvotes'     => 22,
                'downvotes'   => 2,
                'comments'    => 9,
            ],
            [
                'title'       => 'Search result relevance feels off',
                'description' => 'Some search results return unrelated items. I often need to refine the query multiple times.',
                'status'      => 'open',
                'user'        => 'annalee',
                'category'    => 'bug-report',
                'created_at'  => Carbon::now()->subDays(9)->subHours(8),
                'views'       => 1900,
                'upvotes'     => 15,
                'downvotes'   => 4,
                'comments'    => 31,
            ],
            [
                'title'       => 'Temporary fix for slow loading dashboard',
                'description' => 'The dashboard becomes slow when many cards are loaded. A temporary workaround would help until the backend query is optimized.',
                'status'      => 'open',
                'user'        => 'mikejohnson',
                'category'    => 'bug-report',
                'created_at'  => Carbon::now()->subDays(6)->subHours(3),
                'views'       => 2000,
                'upvotes'     => 40,
                'downvotes'   => 7,
                'comments'    => 28,
            ],
            [
                'title'       => 'Request: multiple workspace support',
                'description' => 'Allow users to manage multiple workspaces from the same account, with separate feedback boards for each team.',
                'status'      => 'planned',
                'user'        => 'sarahchen',
                'category'    => 'feature-request',
                'created_at'  => Carbon::now()->subDay()->subHours(3),
                'views'       => 1800,
                'upvotes'     => 52,
                'downvotes'   => 4,
                'comments'    => 16,
            ],
            [
                'title'       => 'Remove forced email confirmation',
                'description' => 'Some users prefer to explore the product before confirming their email address. Forcing confirmation immediately reduces conversion.',
                'status'      => 'open',
                'user'        => 'davidwilson',
                'category'    => 'general-feedback',
                'created_at'  => Carbon::now()->subDays(3)->subHours(4),
                'views'       => 1200,
                'upvotes'     => 10,
                'downvotes'   => 42,
                'comments'    => 18,
            ],
        ];

        $seededFeedbacks = [];

        foreach ($feedbackData as $data) {
            $author   = $users->firstWhere('username', $data['user']);
            $category = $categories->get($data['category']);

            if (!$author || !$category) {
                continue;
            }

            $feedback = Feedback::create([
                'user_id'     => $author->id,
                'category_id' => $category->id,
                'title'       => $data['title'],
                'description' => $data['description'],
                'status'      => $data['status'],
            ]);

            $feedback->timestamps = false;
            $feedback->update([
                'created_at' => $data['created_at'],
                'updated_at' => $data['created_at'],
            ]);
            $feedback->timestamps = true;

            $this->seedVotes($feedback, $users, $data['upvotes'], $data['downvotes']);
            $this->seedComments($feedback, $users, $data['comments']);

            $this->refreshCounts($feedback, $data['views']);
            $category->increment('feedback_count');

            $seededFeedbacks[] = $feedback;
        }

        // ---------------------------------------------------------------
        // 2. Ensure every user has at least 2 feedbacks
        // ---------------------------------------------------------------
        $categorySlugs = $categories->keys()->toArray();
        $statuses      = ['open', 'planned', 'in_progress'];
        $titles        = $this->generatedTitles();
        $descriptions  = $this->generatedDescriptions();
        $titleIndex    = 0;

        foreach ($users as $user) {
            $userFeedbackCount = Feedback::where('user_id', $user->id)->count();
            $toCreate          = max(0, 2 - $userFeedbackCount);

            for ($i = 0; $i < $toCreate; $i++) {
                $categorySlug = $categorySlugs[($user->id + $i) % count($categorySlugs)];
                $category     = $categories->get($categorySlug);

                if (!$category) {
                    continue;
                }

                $createdAt = Carbon::now()->subDays(rand(1, 60))->subHours(rand(0, 23));

                $feedback = Feedback::create([
                    'user_id'     => $user->id,
                    'category_id' => $category->id,
                    'title'       => $titles[$titleIndex % count($titles)],
                    'description' => $descriptions[$titleIndex % count($descriptions)],
                    'status'      => $statuses[($user->id + $i) % count($statuses)],
                ]);

                $titleIndex++;

                $feedback->timestamps = false;
                $feedback->update(['created_at' => $createdAt, 'updated_at' => $createdAt]);
                $feedback->timestamps = true;

                $upvotes   = rand(2, 30);
                $downvotes = rand(0, 10);
                $this->seedVotes($feedback, $users, $upvotes, $downvotes);

                if (rand(0, 1)) {
                    $this->seedComments($feedback, $users, rand(1, 6));
                }

                $this->refreshCounts($feedback, rand(100, 800));
                $category->increment('feedback_count');

                $seededFeedbacks[] = $feedback;
            }
        }

        // ---------------------------------------------------------------
        // 3. Ensure every user has cast at least 3 votes
        // ---------------------------------------------------------------
        $allFeedbacks = Feedback::all();

        foreach ($users as $user) {
            $castVotes = Vote::where('user_id', $user->id)->count();
            $needed    = max(0, 3 - $castVotes);

            if ($needed === 0) {
                continue;
            }

            $eligibleFeedbacks = $allFeedbacks
                ->where('user_id', '!=', $user->id)
                ->filter(fn ($f) => !Vote::where('user_id', $user->id)
                    ->where('feedback_id', $f->id)->exists())
                ->shuffle()
                ->take($needed);

            foreach ($eligibleFeedbacks as $feedback) {
                $type = rand(0, 3) === 0 ? 'down' : 'up'; // ~75 % upvotes

                Vote::updateOrCreate(
                    ['user_id' => $user->id, 'feedback_id' => $feedback->id],
                    ['type'    => $type]
                );

                $this->refreshCounts($feedback);
            }
        }
    }

    // -------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------

    private function seedVotes(Feedback $feedback, Collection $users, int $upvotes, int $downvotes): void
    {
        $eligibleVoters = $users->where('id', '!=', $feedback->user_id)->shuffle();

        $this->createVoteBatch($feedback, $eligibleVoters->slice(0, $upvotes), 'up');
        $this->createVoteBatch($feedback, $eligibleVoters->slice($upvotes, $downvotes), 'down');
    }

    private function createVoteBatch(Feedback $feedback, Collection $voters, string $type): void
    {
        foreach ($voters as $user) {
            Vote::updateOrCreate(
                ['user_id' => $user->id, 'feedback_id' => $feedback->id],
                ['type'    => $type]
            );
        }
    }

    private function seedComments(Feedback $feedback, Collection $users, int $commentsCount): void
    {
        $commentUsers = $users->where('id', '!=', $feedback->user_id)->shuffle();
        $topLevel     = max(1, (int) ceil($commentsCount * 0.7));
        $bodyPool     = $this->commentBodies();
        $replyPool    = $this->replyBodies();
        $topComments  = [];

        for ($i = 0; $i < $topLevel; $i++) {
            $commentUsers = $commentUsers->shuffle();
            $topComments[] = Comment::create([
                'user_id'     => $commentUsers->first()->id,
                'feedback_id' => $feedback->id,
                'body'        => $bodyPool[array_rand($bodyPool)],
            ]);
        }

        for ($i = 0; $i < $commentsCount - $topLevel; $i++) {
            $parent       = $topComments[array_rand($topComments)];
            $commentUsers = $commentUsers->shuffle();
            Comment::create([
                'user_id'     => $commentUsers->first()->id,
                'feedback_id' => $feedback->id,
                'parent_id'   => $parent->id,
                'body'        => $replyPool[array_rand($replyPool)],
            ]);
        }
    }

    private function refreshCounts(Feedback $feedback, int $views = 0): void
    {
        $feedback->refresh();
        $feedback->update([
            'views_count'     => $views ?: ($feedback->views_count ?? rand(100, 500)),
            'upvotes_count'   => $feedback->votes()->where('type', 'up')->count(),
            'downvotes_count' => $feedback->votes()->where('type', 'down')->count(),
            'votes_count'     => $feedback->votes()->where('type', 'up')->count()
                                 - $feedback->votes()->where('type', 'down')->count(),
            'comments_count'  => $feedback->allComments()->count(),
        ]);
    }

    // -------------------------------------------------------------------
    // Content pools
    // -------------------------------------------------------------------

    private function generatedTitles(): array
    {
        return [
            'Add export to CSV functionality',
            'Support two-factor authentication',
            'Show last-seen timestamp on profiles',
            'Allow bulk actions on feedback list',
            'Add emoji reactions to comments',
            'Provide RSS feed for public roadmap',
            'Improve table responsiveness on mobile',
            'Add a changelog / release notes page',
            'Let users subscribe to feedback threads',
            'Option to merge duplicate feedback items',
            'Keyboard navigation for the sidebar',
            'Color-coded status labels',
            'Add activity log to each feedback item',
            'Support file attachments in feedback',
            'Show trending feedback on the homepage',
            'Introduce feedback templates',
            'Display voter count breakdown on each card',
            'Allow admins to pin important feedback',
            'Integrate with GitHub Issues',
            'Add a "resolved" confirmation flow',
            'Make tag filtering multi-select',
            'Notify author when status changes',
            'Compact / list view for feedback board',
            'Add print-friendly feedback view',
            'Show open rate per category',
            'Weekly digest email for new feedback',
            'Allow anonymous feedback submissions',
            'Sort comments by newest / oldest',
            'Highlight unread comments since last visit',
            'Add a quick poll widget to roadmap items',
            'Customizable feedback form fields',
            'Public API for reading feedback data',
            'Archive old resolved feedback automatically',
            'Show contributor leaderboard',
            'Dark mode for email notifications',
            'Drag-and-drop reordering of roadmap stages',
            'Copy feedback link to clipboard button',
            'Suggested related feedback on submission',
            'Fullscreen comment editor',
            'Multi-language support (i18n)',
            'Advanced permission roles for team members',
            'Mention users with @ in comments',
            'Preview mode before posting feedback',
            'Lock feedback after status is resolved',
            'Reaction summary tooltip on hover',
            'Show estimated delivery date on planned items',
            'Batch-export feedback as PDF report',
            'Feedback scoring based on impact and effort',
            'User-generated tags / labels',
            'Collapsible sidebar categories',
            'Bug: avatar does not load on slow connections',
            'Bug: date picker breaks on Safari',
            'Bug: vote count resets after page refresh',
            'Bug: comment box loses focus unexpectedly',
            'Bug: pagination skips items at page boundary',
            'Performance: lazy-load images in feed',
            'Improve contrast ratio in light theme',
            'Sticky header on long feedback pages',
            'Smooth scroll to first unread comment',
            'Reduce motion option for accessibility',
            'Add read-aloud button for accessibility',
            'Better empty-state illustrations',
            'Onboarding tooltip tour for new users',
            'Show progress bar for in-progress items',
            'Display "last updated" on feedback cards',
            'Allow reactions without an account',
            'Digest of top voted feedback each week',
            'Community upvoting for changelog entries',
            'Admin note field visible only internally',
            'Invite team members via email link',
            'Single sign-on (SSO) support',
            'Auto-link issue tracker tickets in feedback',
            'Custom domain for public roadmap page',
            'Embed roadmap widget on external sites',
            'Category reorder in admin settings',
            'Feedback health score dashboard',
            'Feedback sentiment analysis chart',
            'Smart duplicate detection on submission',
            'Voting ends after status is resolved',
            'Rich preview when sharing feedback links',
            'Notification grouping to reduce inbox noise',
            'Filter feedback by date range',
            'Show feedback volume trend graph',
            'Display recent activity on user profile',
            'Follow-up question after closing feedback',
            'Word count guide while writing feedback',
            'Warning before navigating away from draft',
            'Pagination option: infinite scroll or pages',
            'Support for right-to-left languages',
            'Custom color themes for roadmap board',
            'Link external documentation in feedback',
            'Assign feedback to team member',
            'Time-to-resolve metric per category',
            'Show commenter avatars below feedback card',
            'Drag feedback between status columns',
            'Pin a comment as the official response',
            'Minimize distraction mode for writing',
            'Share feedback via QR code',
            'Guest voting without account creation',
        ];
    }

    private function generatedDescriptions(): array
    {
        return [
            'This feature would significantly improve our workflow and save time for the whole team.',
            'Several users have requested this functionality over the past few months. Would love to see it prioritized.',
            'The current workaround is too cumbersome. A native solution would be much more efficient.',
            'I noticed this issue consistently across Chrome, Firefox, and Safari. Happy to provide more details.',
            'Competitors already offer this. Adding it would improve our feature parity and retention.',
            'A simple implementation would already provide huge value. It does not have to be perfect on day one.',
            'This is blocking our team from fully adopting the platform. A fix or workaround would be appreciated.',
            'I tested this with a few colleagues and they all felt it would improve their daily use considerably.',
            'The UX flow feels unintuitive at this step. A small change here would reduce confusion significantly.',
            'This is a small quality-of-life improvement that would make the product feel more polished overall.',
        ];
    }

    private function commentBodies(): array
    {
        return [
            'I agree with this — the current experience is painful when I use the app at night.',
            'I have the same problem and would love a fix for this.',
            'This works well in other tools, and I think it would help our team a lot.',
            'Can you share the exact steps to reproduce this? I ran into a similar issue.',
            'I think the mobile app should also support offline mode once it exists.',
            'This helped me too. The workflow feels smoother with this improvement.',
            'I disagree because dark mode alone doesn\'t solve the accessibility issues here.',
            'I tested this with several searches and the results were definitely off.',
            'A schedule toggle would be useful, especially for people who work in different time zones.',
            'We already have a workaround by using keyboard shortcuts; a customizable version would still be better.',
            'This is an important bug. I can reproduce it every time I mark a message as read.',
            'I would rather see a more subtle onboarding flow than a full checklist popup.',
            'Do we know if this issue happens on both mobile and desktop?',
            'A markdown editor would make feedback reports easier to read and maintain.',
        ];
    }

    private function replyBodies(): array
    {
        return [
            'Yes, I can confirm the same behavior. It happens after the second refresh.',
            'This is helpful — I found the issue on my end too, and I think it is related to the caching layer.',
            'I would recommend keeping the original workflow while adding this as an optional feature.',
            'Have you tried clearing the app cache? That fixed it for me for a short time.',
            'I like this idea, but I would prefer an opt-in scheduling option instead of automatic activation.',
            'That is not what I expected, and I think more people are going to vote against it.',
            'Can you provide more details about the environment where this happens?',
            'I think this would be a great improvement, especially for new users.',
            'A temporary workaround could be to disable the dashboard widgets until the query is optimized.',
            'If this is rolled out, please support both browser and mobile notifications.',
        ];
    }
}