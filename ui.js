$(async function() {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $favoritedArticles = $("#favorited-articles")


  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();

   /**
   * This is my top priority because it determain how to render my view.
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();
    }
    /**
     * no need for a an else statement since my class method will return null
     * that will default my view

     */
  }
  /**
   * My second top priority is registering events and functionalities
   * loggin in / siging up will come first because they determian the
   * rest of the functionalities [adding stories, favoriting/unfavoriting stories, removing a story]
   * however those functionalities do not have a precedence priority over each otehr.account-form
   * it all depends on the user's choices
   */


  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle(1000);
    $createAccountForm.slideToggle(1000);
    $allStoriesList.toggle();
  });

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

   /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function() {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });


  /**
   * a function to handle adding a story functionality
   */
  $submitForm.on('click', 'button',  async function (e) {
    e.preventDefault();
    if (currentUser) {
      const story = { author: $('#author').val(), title: $('#title').val(), url: $('#url').val() };
      const newStory = await StoryList.addStory(currentUser, story);
      console.log(newStory)
      $submitForm.trigger('reset')
      generateStories()
    }

  })

  /**
   * an evnt listener to handle favoriting/unfavoriting a story by the user
   *
   */
  $allStoriesList .on('click', '.fa-star',  async function (e) {
      storyId = $(this).parent()[0].id
      if ($(this).attr('class').includes('far')) {
        $(this).toggleClass('far fas');
      // favorite story
      await currentUser.favoriteStory(storyId)
    }
    else {
    //  unfavorite story
    $(this).toggleClass('far fas');
      await currentUser.unfavoriteStory(storyId)
    }
  })

  /**
   * an evnt listener to handle deleting  a story by the user
   *
   */

  $ownStories.on('click', '.trash-can', async function (e) {
    // console.log($(this).parent().attr('id'))
    if (currentUser) {
      id = $(this).parent().attr('id')
       await currentUser.deleteStory(id)
      updateOwnStories()
    }
  })





  /**
   * My third priority is allwoing the user to navigate to different areas of the page
   * each click will respond to a series of hiding other areas and showing the desired area.
   */

  /**
   * Event handler for Navigation to Homepage
   * //todo: change the body to somethnig more specific
   */

  $("body").on("click", "#nav-all", async function() {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });

   /**
    * event listener for navigiating the submit story area
    * once the user clicks here, you want to show the form, hide anything that is irrelevant
    */
  $('#nav-submit').on('click', async function () {
      // hide stuff
    hideElements();
    $submitForm.slideToggle(1000);
  })

   /**
    * event listener for navigiating the favorite stories area
    * once the user clicks here, you want to show the favorites, hide anything that is irrelevant
    */
  $("#nav-favorites").on('click', async function () {
    $favoritedArticles.empty()
    if (currentUser) {
      hideElements()
      $favoritedArticles.show()
    }
    if (currentUser.favorites.length == 0) {
      $favoritedArticles.html('<h5>No stories has been favorited yet</h5>')
    }
    else {
      // show favorites
      currentUser.favorites.forEach(fav => {
        favMarkup = generateStoryHTML(fav)
        $favoritedArticles.append(favMarkup)
      })
    }

  })


  /**
    * event listener for navigiating stories create by the user
    * once the user clicks here, you want to show the user created stories, hide anything that is irrelevant
    */
  // maybe no need to add a variable, since this has one usage only
  $("#nav-my-stories").on('click',updateOwnStories )


  function updateOwnStories() {
    $ownStories.empty()
    if (currentUser) {
      hideElements()
      $ownStories.show()
    }
    if (currentUser.ownStories.length == 0) {
      $ownStories.html('<h5>You have not added stories yet</h5>')
    }
    else {
      currentUser.ownStories.forEach(ownStory => {
        $trashCan = (` <i class="fas fa-trash-alt  trash-can" id="trash-${ownStory.storyId}">
          </i>`)
        ownStoryMarkup = generateStoryHTML(ownStory)
        ownStoryMarkup.prepend($trashCan)
        $ownStories.append(ownStoryMarkup)
      })
    }

   }
  // }


  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();

    // update the navigation bar
    showNavForLoggedInUser();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);
    let storyMarkup = ''
    let star = ''

    if (currentUser) {
      let favIds = currentUser.favorites.map(fav => fav.storyId)
      favIds.includes(story.storyId)? star = 'fas fa-star' : star = 'far fa-star'
    }

     storyMarkup = $(`
      <li id="${story.storyId}">

      <i class="${star}" id="favorite-${story.storyId}"></i>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);


    return storyMarkup;
  }

  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm,
      $favoritedArticles
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
    // show more navigation options:
    $('.main-nav-links').show();
    $('#nav-welcome').show()
    $('#user-profile').hide()
    $('#nav-user-profile').html(currentUser.username)

  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }
});
