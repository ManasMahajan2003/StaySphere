const Listing =require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken=process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index=async (req,res)=>{
    // console.log("Layout Path:", path.join(__dirname, "views/layouts/boilerplate.ejs"));
    const allListings = await Listing.find({});
    res.render("listings/index.ejs",{allListings});    
};

module.exports.renderNewForm=(req,res)=>{
    // console.log(req.user);
    res.render("listings/new.ejs");
};

module.exports.showListing=async(req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id)
        .populate({
            path:"reviews",
            populate:{
                path:"author",
            },
        })
        .populate("owner");
    if(!listing){
        req.flash("error", "Listing you requested for does not exist");
        res.redirect("/listings");
    }
    res.render("listings/show.ejs",{listing});
};

module.exports.createListing = async (req, res, next) => {
  try {
      // Check if req.file is defined
      if (!req.file) {
          throw new ExpressError(400, "Image upload is required");
      }

      // Log geocoding request
      console.log('Geocoding request:', req.body.listing.location);
      
      // Ensure geocoding client works correctly
      let response = await geocodingClient
          .forwardGeocode({
              query: req.body.listing.location,
              limit: 1,
          })
          .send();

      // Log geocoding response
      console.log('Geocoding response:', response.body);

      // Validate geocoding response
      if (!response.body.features || response.body.features.length === 0) {
          throw new ExpressError(400, "Invalid location");
      }

      // Extract image data
      let url = req.file.path;
      let filename = req.file.filename;

      // Log image data
      console.log('Image data:', { url, filename });

      // Create new listing
      const newListing = new Listing(req.body.listing);
      newListing.owner = req.user._id;
      newListing.image = { url, filename };
      newListing.geometry = response.body.features[0].geometry;

      // Set default category if not provided
      if (!newListing.category) {
          newListing.category = 'other'; // or any default category
      }

      // Save listing to database
      let savedListing = await newListing.save();
      console.log('Saved listing:', savedListing);

      req.flash("success", "New Listing Created");
      res.redirect("/listings");
  } catch (e) {
      console.error('Error creating listing:', e);
      next(e);
  }
};


module.exports.renderEditForm=async (req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing you requested for does not exist");
        res.redirect("/listings");
    }
    let originalImageUrl=listing.image.url;
    originalImageUrl=originalImageUrl.replace("/upload","/upload/w_250");
    res.render("listings/edit.ejs",{listing,originalImageUrl});
};

module.exports.updateListing=async (req,res)=>{
    let {id}=req.params;
    
    let listing=await Listing.findByIdAndUpdate(id,{...req.body.listing});
    if(typeof req.file !== "undefined"){
    let url=req.file.path;
    let filename=req.file.filename;
    listing.image={url,filename};
    await listing.save();
    }
    req.flash("success","Listing Updated");
    res.redirect(`/listings/${id}`);
};

module.exports.deleteListing=async(req,res)=>{
    let {id}=req.params;
    let deletedListing=await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success","Listing Deleted");
    res.redirect("/listings");
};

module.exports.showFilterListing=async (req, res) => {
    const filterType = req.params.filterType;
    let filteredListings;
  
    switch(filterType) {
      case 'trending':
        filteredListings = await Listing.find({ category: 'trending' });
        break;
      case 'rooms':
        filteredListings = await Listing.find({ category: 'rooms' });
        break;
      case 'iconic-cities':
        filteredListings = await Listing.find({ category: 'iconic-cities' });
        break;
      case 'mountains':
        filteredListings = await Listing.find({ category: 'mountains' });
        break;
      case 'castles':
        filteredListings = await Listing.find({ category: 'castles' });
        break;
      case 'pools':
        filteredListings = await Listing.find({ category: 'pools' });
        break;
      case 'camping':
        filteredListings = await Listing.find({ category: 'camping' });
        break;
      case 'farms':
        filteredListings = await Listing.find({ category: 'farms' });
        break;
      case 'arctic':
        filteredListings = await Listing.find({ category: 'arctic' });
        break;
      default:
        filteredListings = await Listing.find();
        break;
    }
  
    res.render('listings/index.ejs', { allListings: filteredListings });
};