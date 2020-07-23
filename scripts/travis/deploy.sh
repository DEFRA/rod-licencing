#!/bin/bash
###############################################################################
#  Travis deployment script
###############################################################################
set -e
trap 'exit 1' INT

[[ "${TRAVIS_COMMIT_MESSAGE}" =~ ^(patch|hotfix) ]] && PATCH_RELEASE=true || PATCH_RELEASE=false
echo "Executing deployment - TRAVIS_BRANCH=${TRAVIS_BRANCH}, TRAVIS_COMMIT_MESSAGE=${TRAVIS_COMMIT_MESSAGE}, PATCH_RELEASE=${PATCH_RELEASE}"

# Use the npm semver package to help determine release versions
echo "Installing semver"
npm i -g semver

echo "Checking out target branch"
git checkout "${TRAVIS_BRANCH}"
git branch -avl

# Ensure that git will return tags with pre-releases in the correct order (e.g. 0.1.0-rc.0 occurs before 0.1.0)
echo "Removing existing git tag versionsort configuration"
git config --global --unset-all versionsort.suffix || echo "No existing versionsort.suffix found it git configuration."
echo "Setting required git tag versionsort configuration"
git config --global --add versionsort.suffix -beta.
git config --global --add versionsort.suffix -rc.

# Calculate PREVIOUS_VERSION and NEW_VERSION based on the source and target of the merge
echo "Determining versions for release"
if [ "${TRAVIS_BRANCH}" == "master" ]; then
    # Creating new release on the master branch, determine latest release version on master branch only
    PREVIOUS_VERSION=$(git tag --list --merged master --sort=version:refname | tail -1)
    echo "Latest build on the master branch is ${PREVIOUS_VERSION}"
    if [ ${PATCH_RELEASE} == true ]; then
        NEW_VERSION="v$(semver "${PREVIOUS_VERSION}" -i patch)"
    else
        NEW_VERSION="v$(semver "${PREVIOUS_VERSION}" -i minor)"
    fi
elif [ "$TRAVIS_BRANCH" == "develop" ]; then
    # Creating new release on the develop branch, determine latest release version on either develop or master
    PREVIOUS_VERSION=$(git tag --list --sort=version:refname | tail -1)
    echo "Latest build in the repository is ${PREVIOUS_VERSION}"
    if [[ ${PREVIOUS_VERSION} =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        # Most recent version is a production release on master, start a new prerelease on develop
        NEW_VERSION="v$(semver "${PREVIOUS_VERSION}" -i preminor --preid rc)"
    else
        # Most recent version is already a pre-release on the develop branch, just increment the pre-release number
        NEW_VERSION="v$(semver "${PREVIOUS_VERSION}" -i prerelease --preid rc)"
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
echo "Pushing new release to the remote"
git push origin "${TRAVIS_BRANCH}:${TRAVIS_BRANCH}" --no-verify

echo "Pushing new release tag to the remote"
git tag "${NEW_VERSION}" -m "${NEW_VERSION}" -f
git push origin "${NEW_VERSION}"

# Publish packages to npm
echo "Publishing latest packages to npm"
lerna publish from-git --yes --pre-dist-tag rc

# If we've pushed a new release into master and it is not a hotfix/patch, then merge the changes back to develop
if [ "${TRAVIS_BRANCH}" == "master" ] && [ ${PATCH_RELEASE} == false ]; then
  git checkout develop
  git merge -X theirs master
  git push origin develop:develop --no-verify
fi