use strict;
use warnings;

use Data::Dumper ();
use Getopt::Long ();

Getopt::Long::GetOptions(
    'target|t=s' => \ my $sTarget,
);

my $phNodes = {};

sub find_path {
    my ($sSeek, $paPath, $phSearch, $iDepth, $iMaxDepth) = @_;

    if ($iDepth >= $iMaxDepth) { return; }
    $iDepth += 1;

    if (ref $phSearch ne 'HASH') { return; }
    foreach my $sKey (keys %{$phSearch}) {
        if (exists($phNodes->{$sKey})) {
            next;
        }
        $phNodes->{$sKey} = $iDepth;

        my @aNewPath = @{$paPath};
        push(@aNewPath, $sKey);

        if ($aNewPath[-1] eq $sSeek) {
            return \@aNewPath;
        }
        else {
            my $paOtherPath = find_path($sSeek, \@aNewPath, $phSearch->{$sKey}, $iDepth, $iMaxDepth);
            if (ref $paOtherPath eq 'ARRAY' && $paOtherPath->[-1] eq $sSeek) { return $paOtherPath; }            
        }
    }
}

my $phMap = {};
for (my $a = 1; $a < 8; $a++) {
    for (my $b = 3; $b < 10; $b++) {
        for (my $c = 0; $c < 7; $c++) {
            $phMap->{$a}->{"${a}_${b}"}->{"${a}_${b}_${c}"} = 1;
        }
    }
}

my $paFinal = find_path($sTarget, [], $phMap, 0, 10);
print(join(" ; ", @{$paFinal}));
