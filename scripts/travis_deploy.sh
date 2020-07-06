#!/bin/bash
set -e
###############################################################################
#  Travis deployment script
###############################################################################
trap 'exit 1' INT
npm i -g semver

# Ensure that git will return tags with pre-releases in the correct order (e.g. 0.1.0-rc.0 occurs before 0.1.0)
git config --unset-all versionsort.suffix
git config --add versionsort.suffix -rc.

# Calculate PREVIOUS_VERSION and NEW_VERSION based on the source and target of the merge
if [ "${TRAVIS_BRANCH}" == "master" ]; then
    # Creating new release on the master branch, determine latest release version on master branch only
    PREVIOUS_VERSION=$(git tag --list --points-at master --sort=version:refname | tail -1)
    echo "Latest build on the master branch is ${PREVIOUS_VERSION}"
    if [ "${TRAVIS_PULL_REQUEST_BRANCH}" == "develop" ]; then
        # Merge PR from develop, we'll bump the minor version number
        NEW_VERSION=$(semver "${PREVIOUS_VERSION}" -i minor)
    else
        # Merge PR from a hotfix branch, we'll bump the patch version
        NEW_VERSION=$(semver "${PREVIOUS_VERSION}" -i patch)
    fi
elif [ "$TRAVIS_BRANCH" == "develop" ]; then
    # Creating new release on the develop branch, determine latest release version on either develop or master
    PREVIOUS_VERSION=$(git tag --list --sort=version:refname | tail -1)
    echo "Latest build in the repository is ${PREVIOUS_VERSION}"
    if [[ ${PREVIOUS_VERSION} =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        # Most recent version is a production release on master, start a new prerelease on develop
        NEW_VERSION=$(semver "${PREVIOUS_VERSION}" -i preminor --preid rc)
    else
        # Most recent version is already a pre-release on the develop branch, just increment the pre-release number
        NEW_VERSION=$(semver "${PREVIOUS_VERSION}" -i prerelease --preid rc)
    fi
else
    echo "Skipping deployment for branch ${TRAVIS_BRANCH}"
    exit 0
fi

echo "Updating version from ${PREVIOUS_VERSION} to ${NEW_VERSION}"
# Update package files versions, project inter-dependencies and lerna.json with new version number
lerna version "${NEW_VERSION}" --yes --no-push --force-publish --exact

# Generate changelog information for changes since the last tag
echo "Generating changelog updates for all changes between ${PREVIOUS_VERSION} and ${NEW_VERSION}"
lerna-changelog --from "${PREVIOUS_VERSION}" --to "${NEW_VERSION}" | cat - CHANGELOG.md > CHANGELOG.new && mv CHANGELOG.new CHANGELOG.md
git commit -a --amend --no-edit --no-verify

# Push new tag, updated changelog and package metadata to the remote
git push

# Publish packages to npm
lerna publish from-git --yes --no-git-reset --pre-dist-tag rc

echo "Finished at $(date)"
